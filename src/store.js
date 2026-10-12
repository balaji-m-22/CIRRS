// Tiny persistent store: keeps everything in memory (fast, simple) and
// saves it to a JSON file so data survives a server restart.
const fs = require('fs');
const path = require('path');

const FILE = process.env.CIRRS_DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');

const state = {
  users: [],
  departments: [],
  reports: [],
  notifications: [],
  counters: { users: 1, departments: 1, reports: 1, notifications: 1 },
};

if (fs.existsSync(FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    Object.assign(state, saved, { counters: { ...state.counters, ...saved.counters } });
  } catch (err) {
    console.error('Could not read data file, starting empty:', err.message);
  }
}

function flush() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE);
}

let timer = null;
function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 150);
  timer.unref?.();
}

const nextId = (collection) => state.counters[collection]++;

process.on('exit', () => { try { flush(); } catch { /* ignore */ } });
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

module.exports = { state, save, flush, nextId, FILE };
