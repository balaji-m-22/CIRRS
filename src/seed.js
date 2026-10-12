// Creates the default departments and demo staff accounts the first time the server runs.
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Department = require('./models/Department');

const DEPARTMENTS = [
  { name: 'Roads & Infrastructure', categories: ['pothole'] },
  { name: 'Electricity', categories: ['streetlight'] },
  { name: 'Sanitation', categories: ['garbage'] },
  { name: 'Water Supply', categories: ['water'] },
  { name: 'General Services', categories: ['other'] },
];

function seed() {
  if (Department.findAll().length === 0) DEPARTMENTS.forEach((d) => Department.create(d));
  if (User.findAll().length > 0) return;

  const hash = (p) => bcrypt.hashSync(p, 10);
  User.create({ name: 'System Admin', email: 'admin@cirrs.local', phone: '9000000001', role: 'admin', passwordHash: hash('Admin@123') });
  User.create({ name: 'Municipal Staff', email: 'staff@cirrs.local', phone: '9000000002', role: 'staff', passwordHash: hash('Staff@123') });
  Department.findAll().forEach((d, i) => {
    const slug = d.name.split(/[ &]/)[0].toLowerCase();
    User.create({
      name: `${d.name} Officer`, email: `officer.${slug}@cirrs.local`, phone: `900000010${i}`,
      role: 'officer', departmentId: d.id, passwordHash: hash('Officer@123'),
    });
  });
  console.log('Seeded demo accounts (see README for the logins). Change these passwords before real use.');
}

module.exports = seed;
