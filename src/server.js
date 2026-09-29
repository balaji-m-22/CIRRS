require('dotenv').config();
const express = require('express');
const config = require('./config');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'CIRRS backend' }));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
   // TODO: integrate NotificationService to alert citizens on report status changes
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(config.port, () => console.log(`CIRRS backend running on port ${config.port}`));
