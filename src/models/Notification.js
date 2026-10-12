// Notification (class diagram). One row per recipient.
const { state, save, nextId } = require('../store');

function create({ userId, message, reportId = null }) {
  const n = { id: nextId('notifications'), userId, message, reportId, read: false, createdAt: new Date().toISOString() };
  state.notifications.push(n);
  save();
  return n;
}

const forUser = (userId) =>
  state.notifications.filter((n) => n.userId === userId).sort((a, b) => b.id - a.id);

function markAllRead(userId) {
  state.notifications.forEach((n) => { if (n.userId === userId) n.read = true; });
  save();
}

function markRead(userId, id) {
  const n = state.notifications.find((x) => x.id === id && x.userId === userId);
  if (n) { n.read = true; save(); }
  return n;
}

module.exports = { create, forUser, markAllRead, markRead };
