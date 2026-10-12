// NotificationService (Notification Service actor in the use case diagram).
// For now notifications are stored in-app; an email/SMS provider can be plugged in at send().
const Notification = require('../models/Notification');
const User = require('../models/User');

function send(userId, message, reportId) {
  Notification.create({ userId, message, reportId });
}

function sendToRole(role, message, reportId) {
  User.findAll().filter((u) => u.role === role && u.active).forEach((u) => send(u.id, message, reportId));
}

function sendToDepartmentOfficers(departmentId, message, reportId) {
  User.findAll()
    .filter((u) => u.role === 'officer' && u.active && u.departmentId === departmentId)
    .forEach((u) => send(u.id, message, reportId));
}

module.exports = { send, sendToRole, sendToDepartmentOfficers };
