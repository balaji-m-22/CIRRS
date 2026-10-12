// Report workflow, following the state chart:
// Reported -> Verified -> Assigned -> InProgress -> Resolved -> Closed
//          \-> Rejected              (Assigned <-> Reassigned,  Resolved -> Reopened -> Assigned)
const Report = require('../models/Report');
const User = require('../models/User');
const Department = require('../models/Department');
const notify = require('./notificationService');
const { savePhoto } = require('../utils/photos');

const fail = (status, message) => Object.assign(new Error(message), { status });
const label = (r) => `#${r.id} (${r.category})`;

// ---- who can see / do what -------------------------------------------------
function canView(user, report) {
  if (user.role === 'admin' || user.role === 'staff') return true;
  if (user.role === 'citizen') return report.citizenId === user.id;
  if (user.role === 'officer') return !!report.departmentId && report.departmentId === user.departmentId;
  return false;
}

const officerOwns = (user, r) =>
  user.role === 'officer' && r.departmentId === user.departmentId && (!r.officerId || r.officerId === user.id);

// The list of actions this user may take on this report right now.
// The web client simply shows a panel for each one, so the rules live in one place.
function allowedActions(user, r) {
  const actions = [];
  const isTriage = user.role === 'staff' || user.role === 'admin';
  if (isTriage && r.status === 'Reported') actions.push('verify', 'reject');
  if (isTriage && r.status === 'Verified') actions.push('assign', 'reject');
  if (isTriage && ['Assigned', 'InProgress'].includes(r.status)) actions.push('assign'); // reassign
  if (officerOwns(user, r)) {
    if (r.status === 'Assigned') actions.push('accept');
    if (r.status === 'InProgress') actions.push('progress', 'resolve');
  }
  if (r.status === 'Resolved') {
    if (user.role === 'citizen' && r.citizenId === user.id) actions.push('close', 'reopen');
    if (isTriage) actions.push('close');
  }
  return actions;
}

// ---- helpers ---------------------------------------------------------------
function record(report, user, event, note, status = report.status) {
  report.status = status;
  report.updatedAt = new Date().toISOString();
  report.history.push({ status, event, note: note || '', byId: user.id, byName: user.name, byRole: user.role, at: report.updatedAt });
  Report.save();
}

function present(report, user) {
  const citizen = User.findById(report.citizenId);
  const dept = report.departmentId ? Department.findById(report.departmentId) : null;
  const officer = report.officerId ? User.findById(report.officerId) : null;
  const out = {
    ...report,
    citizenName: citizen ? citizen.name : 'Unknown',
    departmentName: dept ? dept.name : null,
    officerName: officer ? officer.name : null,
    allowedActions: allowedActions(user, report),
  };
  // citizens don't need the internal ids of staff in the timeline
  if (user.role === 'citizen') out.history = report.history.map(({ byId, ...h }) => h);
  return out;
}

function need(text, min, name) {
  if (typeof text !== 'string' || text.trim().length < min) throw fail(400, `${name} must be at least ${min} characters`);
  return text.trim();
}

function ensure(report, user, action) {
  if (!allowedActions(user, report).includes(action)) {
    throw fail(409, `You cannot "${action}" a report that is ${report.status}`);
  }
}

// ---- transitions -----------------------------------------------------------
const actions = {
  verify(report, user, body) {
    if (body.priority !== undefined && !Report.PRIORITIES.includes(body.priority)) {
      throw fail(400, `priority must be one of: ${Report.PRIORITIES.join(', ')}`);
    }
    if (body.priority) report.priority = body.priority;
    record(report, user, 'Verified', `Report verified (priority: ${report.priority})`, 'Verified');
    notify.send(report.citizenId, `Your report ${label(report)} was verified by the municipal staff.`, report.id);
  },

  reject(report, user, body) {
    const reason = need(body.reason, 5, 'reason');
    report.rejectionReason = reason;
    record(report, user, 'Rejected', reason, 'Rejected');
    notify.send(report.citizenId, `Your report ${label(report)} was rejected: ${reason}`, report.id);
  },

  assign(report, user, body) {
    const dept = Department.findById(body.departmentId);
    if (!dept) throw fail(400, 'A valid departmentId is required');
    let officer = null;
    if (body.officerId) {
      officer = User.findById(body.officerId);
      if (!officer || officer.role !== 'officer' || officer.departmentId !== dept.id) {
        throw fail(400, 'That officer does not belong to the selected department');
      }
    }
    const reassigned = !!report.departmentId;
    report.departmentId = dept.id;
    report.officerId = officer ? officer.id : null;
    record(report, user, reassigned ? 'Reassigned' : 'Assigned',
      `${reassigned ? 'Reassigned' : 'Assigned'} to ${dept.name}${officer ? ` (${officer.name})` : ''}`, 'Assigned');
    const msg = `Report ${label(report)} was assigned to you / your department (${dept.name}).`;
    if (officer) notify.send(officer.id, msg, report.id);
    else notify.sendToDepartmentOfficers(dept.id, msg, report.id);
    notify.send(report.citizenId, `Your report ${label(report)} was assigned to ${dept.name}.`, report.id);
  },

  accept(report, user) {
    report.officerId = user.id;
    record(report, user, 'Accepted', 'Assignment accepted, work started', 'InProgress');
    notify.send(report.citizenId, `Work has started on your report ${label(report)}.`, report.id);
  },

  progress(report, user, body) {
    record(report, user, 'Progress', need(body.note, 3, 'note'));
    notify.send(report.citizenId, `Progress update on your report ${label(report)}.`, report.id);
  },

  resolve(report, user, body) {
    const note = need(body.note, 5, 'note');
    const photo = savePhoto(body.photo); // resolution proof is mandatory
    report.resolution = { note, photo, completionDate: new Date().toISOString(), resolvedBy: user.id };
    record(report, user, 'Resolved', note, 'Resolved');
    notify.send(report.citizenId, `Your report ${label(report)} was resolved. Please review the proof and confirm.`, report.id);
  },

  close(report, user) {
    record(report, user, 'Closed', user.role === 'citizen' ? 'Citizen confirmed the fix' : 'Closed by staff', 'Closed');
    if (user.role !== 'citizen') notify.send(report.citizenId, `Your report ${label(report)} was closed.`, report.id);
  },

  reopen(report, user, body) {
    const reason = need(body.reason, 5, 'reason');
    record(report, user, 'Reopened', reason, 'Assigned');
    report.resolution = null;
    const msg = `Citizen reopened report ${label(report)}: ${reason}`;
    notify.sendToDepartmentOfficers(report.departmentId, msg, report.id);
    notify.sendToRole('staff', msg, report.id);
  },
};

function perform(name, report, user, body = {}) {
  ensure(report, user, name);
  actions[name](report, user, body);
  return report;
}

function createReport(user, body) {
  const photo = savePhoto(body.photo);
  const report = Report.create({
    citizenId: user.id,
    category: body.category,
    description: body.description,
    latitude: body.latitude,
    longitude: body.longitude,
    address: body.address,
    photo,
  });
  notify.sendToRole('staff', `New report ${label(report)} is waiting for verification.`, report.id);
  return report;
}

module.exports = { canView, present, perform, createReport, actionNames: Object.keys(actions), fail };
