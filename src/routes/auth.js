const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register  (citizens register themselves)
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password || password.length < 8) {
    return res.status(400).json({ error: 'name, email, phone and a password of 8+ characters are required' });
  }
  if (User.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = User.create({ name, email: email.toLowerCase(), phone, passwordHash });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = email && User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ token });
});

module.exports = router;
