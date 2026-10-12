// Department (class diagram). `categories` = issue categories it normally handles.
const { state, save, nextId } = require('../store');

const findAll = () => state.departments;
const findById = (id) => state.departments.find((d) => d.id === Number(id));
const findByName = (name) => state.departments.find((d) => d.name.toLowerCase() === String(name).toLowerCase());

function create({ name, categories = [] }) {
  const dept = { id: nextId('departments'), name: name.trim(), categories };
  state.departments.push(dept);
  save();
  return dept;
}

function update(dept, { name, categories }) {
  if (name !== undefined) dept.name = name.trim();
  if (categories !== undefined) dept.categories = categories;
  save();
  return dept;
}

function remove(dept) {
  state.departments.splice(state.departments.indexOf(dept), 1);
  save();
}

module.exports = { findAll, findById, findByName, create, update, remove };
