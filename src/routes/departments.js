const express = require('express');
const Department = require('../models/Department');
const Report = require('../models/Report');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function clean(body, partial = false) {
  const errors = [];
  const out = {};
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) errors.push('name is required');
    else out.name = body.name;
  }
  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories) || body.categories.some((c) => !Report.CATEGORIES.includes(c))) {
      errors.push(`categories must be a list of: ${Report.CATEGORIES.join(', ')}`);
    } else out.categories = body.categories;
  }
  return { errors, out };
}

router.get('/', (req, res) => res.json(Department.findAll()));

router.post('/', authorize('admin'), (req, res) => {
  const { errors, out } = clean(req.body);
  if (errors.length) return res.status(400).json({ errors });
  if (Department.findByName(out.name)) return res.status(409).json({ error: 'Department already exists' });
  res.status(201).json(Department.create(out));
});

router.patch('/:id', authorize('admin'), (req, res) => {
  const dept = Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Department not found' });
  const { errors, out } = clean(req.body, true);
  if (errors.length) return res.status(400).json({ errors });
  const clash = out.name && Department.findByName(out.name);
  if (clash && clash.id !== dept.id) return res.status(409).json({ error: 'Department already exists' });
  res.json(Department.update(dept, out));
});

router.delete('/:id', authorize('admin'), (req, res) => {
  const dept = Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Department not found' });
  const inUse = Report.findAll().some((r) => r.departmentId === dept.id) || User.findAll().some((u) => u.departmentId === dept.id);
  if (inUse) return res.status(409).json({ error: 'Department has reports or officers and cannot be deleted' });
  Department.remove(dept);
  res.status(204).end();
});

module.exports = router;
