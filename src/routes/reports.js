const express = require('express');
const Report = require('../models/Report');
const { authenticate, authorize } = require('../middleware/auth');
const validateReport = require('../middleware/validateReport');

const router = express.Router();
router.use(authenticate);

// POST /api/reports - citizen submits an issue
router.post('/', authorize('citizen'), validateReport, (req, res) => {
  const { category, description, latitude, longitude, photo } = req.body;
  const report = Report.create({ citizenId: req.user.id, category, description, latitude, longitude, photo });
  res.status(201).json(report);
});

// GET /api/reports - citizens see their own, staff/officers/admins see all
router.get('/', (req, res) => {
  const all = Report.findAll();
  res.json(req.user.role === 'citizen' ? all.filter((r) => r.citizenId === req.user.id) : all);
});

// GET /api/reports/:id
router.get('/:id', (req, res) => {
  const report = Report.findById(Number(req.params.id));
  if (!report) return res.status(404).json({ error: 'Report not found' });
  if (req.user.role === 'citizen' && report.citizenId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(report);
});

// PATCH /api/reports/:id/status - staff/officers/admins update the status
router.patch('/:id/status', authorize('staff', 'officer', 'admin'), (req, res) => {
  const report = Report.findById(Number(req.params.id));
  if (!report) return res.status(404).json({ error: 'Report not found' });
  if (!Report.STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: `status must be one of: ${Report.STATUSES.join(', ')}` });
  }
  report.status = req.body.status;
  res.json(report);
});

module.exports = router;
