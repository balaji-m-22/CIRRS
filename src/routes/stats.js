const express = require('express');
const Report = require('../models/Report');
const Department = require('../models/Department');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats - monitor reports / generate reports (staff and admin)
router.get('/', authenticate, authorize('staff', 'admin'), (req, res) => {
  const reports = Report.findAll();
  const count = (keyFn, keys) => {
    const out = Object.fromEntries(keys.map((k) => [k, 0]));
    reports.forEach((r) => { const k = keyFn(r); if (k in out) out[k]++; });
    return out;
  };

  const resolved = reports.filter((r) => r.resolution);
  const avgHours = resolved.length
    ? resolved.reduce((s, r) => s + (new Date(r.resolution.completionDate) - new Date(r.createdAt)), 0) / resolved.length / 36e5
    : null;

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: reports.filter((r) => r.createdAt.slice(0, 10) === key).length });
  }

  res.json({
    total: reports.length,
    open: reports.filter((r) => !['Closed', 'Rejected'].includes(r.status)).length,
    resolvedCount: reports.filter((r) => ['Resolved', 'Closed'].includes(r.status)).length,
    avgResolutionHours: avgHours === null ? null : Math.round(avgHours * 10) / 10,
    byStatus: count((r) => r.status, Report.STATUSES),
    byCategory: count((r) => r.category, Report.CATEGORIES),
    byDepartment: Object.fromEntries(Department.findAll().map((d) => [d.name, reports.filter((r) => r.departmentId === d.id).length])),
    last14Days: days,
  });
});

module.exports = router;
