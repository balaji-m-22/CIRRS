// In-memory user store (Person / Citizen / Employee from the class diagram).
// Roles: citizen, staff, officer, admin
const users = [];
let nextId = 1;

function create({ name, email, phone, passwordHash, role = 'citizen' }) {
  const user = { id: nextId++, name, email, phone, passwordHash, role };
  users.push(user);
  return user;
}

function findByEmail(email) {
  return users.find((u) => u.email === email.toLowerCase());
}

module.exports = { create, findByEmail };
