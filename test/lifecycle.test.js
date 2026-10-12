// End-to-end test of the whole report lifecycle against a temporary data file.
// Run with:  npm test
const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cirrs-'));
process.env.CIRRS_DATA_FILE = path.join(tmp, 'db.json');
process.env.CIRRS_UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.JWT_SECRET = 'test-secret';

const app = require('../src/app');

// 1x1 PNG
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let server; let base;
test.before(() => new Promise((resolve) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; resolve(); }); }));
test.after(() => server.close());

async function call(method, url, body, token) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const login = async (email, password) => (await call('POST', '/api/auth/login', { email, password })).body.token;

test('full lifecycle: report -> verify -> assign -> accept -> resolve -> close', async () => {
  const reg = await call('POST', '/api/auth/register', { name: 'Test Citizen', email: 'c@test.com', phone: '9876543210', password: 'password1' });
  assert.equal(reg.status, 201);
  const citizen = await login('c@test.com', 'password1');
  const staff = await login('staff@cirrs.local', 'Staff@123');
  const officer = await login('officer.roads@cirrs.local', 'Officer@123');

  // validation
  const bad = await call('POST', '/api/reports', { category: 'x', description: 'short' }, citizen);
  assert.equal(bad.status, 400);

  const created = await call('POST', '/api/reports', { category: 'pothole', description: 'Big pothole near the school gate', latitude: 9.9, longitude: 78.1, photo: PNG }, citizen);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(created.body.status, 'Reported');
  assert.ok(created.body.photo.startsWith('/uploads/'));

  // citizen cannot triage; staff can
  assert.equal((await call('POST', `/api/reports/${id}/verify`, {}, citizen)).status, 409);
  assert.equal((await call('POST', `/api/reports/${id}/verify`, { priority: 'High' }, staff)).body.status, 'Verified');

  // assign to Roads department
  const depts = (await call('GET', '/api/departments', null, staff)).body;
  const roads = depts.find((d) => d.categories.includes('pothole'));
  const assigned = await call('POST', `/api/reports/${id}/assign`, { departmentId: roads.id }, staff);
  assert.equal(assigned.body.status, 'Assigned');

  // officer from another department cannot see it
  const water = await login('officer.water@cirrs.local', 'Officer@123');
  assert.equal((await call('GET', `/api/reports/${id}`, null, water)).status, 404);

  assert.equal((await call('POST', `/api/reports/${id}/accept`, {}, officer)).body.status, 'InProgress');
  assert.equal((await call('POST', `/api/reports/${id}/progress`, { note: 'Material arrived' }, officer)).status, 200);

  // resolution proof is mandatory
  assert.equal((await call('POST', `/api/reports/${id}/resolve`, { note: 'Filled the pothole' }, officer)).status, 400);
  const resolved = await call('POST', `/api/reports/${id}/resolve`, { note: 'Filled the pothole', photo: PNG }, officer);
  assert.equal(resolved.body.status, 'Resolved');
  assert.ok(resolved.body.resolution.photo.startsWith('/uploads/'));

  // citizen reopens, officer resolves again, citizen closes
  assert.equal((await call('POST', `/api/reports/${id}/reopen`, { reason: 'Still sunken on the left' }, citizen)).body.status, 'Assigned');
  await call('POST', `/api/reports/${id}/accept`, {}, officer);
  await call('POST', `/api/reports/${id}/resolve`, { note: 'Re-filled and levelled', photo: PNG }, officer);
  assert.equal((await call('POST', `/api/reports/${id}/close`, {}, citizen)).body.status, 'Closed');

  // citizen got notifications along the way
  const notes = (await call('GET', '/api/notifications', null, citizen)).body;
  assert.ok(notes.unread >= 4);

  // stats + csv for staff only
  const stats = await call('GET', '/api/stats', null, staff);
  assert.equal(stats.body.total, 1);
  assert.equal((await call('GET', '/api/stats', null, citizen)).status, 403);
});

test('rejecting a report and role protection', async () => {
  const citizen = await login('c@test.com', 'password1');
  const staff = await login('staff@cirrs.local', 'Staff@123');
  const r = await call('POST', '/api/reports', { category: 'garbage', description: 'Overflowing bins on 3rd street', latitude: 9.9, longitude: 78.1, photo: PNG }, citizen);
  assert.equal((await call('POST', `/api/reports/${r.body.id}/reject`, {}, staff)).status, 400); // reason required
  const rej = await call('POST', `/api/reports/${r.body.id}/reject`, { reason: 'Duplicate of an existing report' }, staff);
  assert.equal(rej.body.status, 'Rejected');
  assert.equal((await call('GET', '/api/users', null, citizen)).status, 403);
  assert.equal((await call('POST', '/api/departments', { name: 'X1' }, staff)).status, 403);
});
