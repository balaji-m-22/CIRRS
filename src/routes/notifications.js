const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const list = Notification.forUser(req.user.id);
  res.json({ unread: list.filter((n) => !n.read).length, items: list.slice(0, 100) });
});

router.post('/read-all', (req, res) => { Notification.markAllRead(req.user.id); res.status(204).end(); });
router.post('/:id/read', (req, res) => { Notification.markRead(req.user.id, Number(req.params.id)); res.status(204).end(); });

module.exports = router;
