const path = require('path');
const fs = require('fs');
const express = require('express');
const config = require('./config');
const { UPLOAD_DIR } = require('./utils/photos');
const seed = require('./seed');

seed();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'CIRRS backend' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built web app (client/dist) from the same server in production
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
}

// Central error handler: workflow errors carry their own HTTP status
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large (photos must be 5 MB or smaller)' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

module.exports = app;
