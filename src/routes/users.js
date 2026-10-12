const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users?role=officer - staff need the officer list to assign work
router.get('/', authorize('staff', 'admin'), (req, res) => {
  let list = User.findAll();
  if (req.query.role) list = list.filter((u) => u.role === req.query.role);
  if (req.user.role === 'staff') list = list.filter((u) => u.role === 'officer'); // staff only see officers
  res.json(list.map(User.toPublic));
});

// POST /api/users - admin creates staff / officer / admin accounts
router.post('/', authorize('admin'), async (req, res) => {
  const { name, email, phone, password, role, departmentId } = req.body;
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) errors.push('name is required');
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) errors.push('a valid email is required');
  if (typeof phone !== 'string' || !/^\+?[0-9\s-]{7,15}$/.test(phone)) errors.push('a valid phone number is required');
  if (typeof password !== 'string' || password.length < 8) errors.push('password must be at least 8 characters');
  if (!User.ROLES.includes(role)) errors.push(`role must be one of: ${User.ROLES.join(', ')}`);
  if (role === 'officer' && !Department.findById(departmentId)) errors.push('an officer needs a valid departmentId');
  if (errors.length) return res.status(400).json({ errors });
  if (User.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' });
  const user = User.create({ name, email, phone, role, departmentId, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(User.toPublic(user));
});

// PATCH /api/users/:id - admin activates / deactivates, changes department
router.patch('/:id', authorize('admin'), (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.active !== undefined) {
    if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot deactivate your own account' });
    user.active = !!req.body.active;
  }
  if (req.body.departmentId !== undefined && user.role === 'officer') {
    if (!Department.findById(req.body.departmentId)) return res.status(400).json({ error: 'Invalid departmentId' });
    user.departmentId = Number(req.body.departmentId);
  }
  User.save();
  res.json(User.toPublic(user));
});

module.exports = router;
