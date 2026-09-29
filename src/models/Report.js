// In-memory report store (Issue class from the class diagram).
// Statuses follow the state chart diagram.
const STATUSES = ['Reported', 'Verified', 'Assigned', 'InProgress', 'Resolved', 'Closed', 'Rejected'];
const CATEGORIES = ['pothole', 'streetlight', 'garbage', 'water', 'other'];

const reports = [];
let nextId = 1;

function create({ citizenId, category, description, latitude, longitude, photo }) {
  const report = {
    id: nextId++,
    citizenId,
    category,
    description,
    latitude,
    longitude,
    photo,
    status: 'Reported',
    createdAt: new Date().toISOString(),
  };
  reports.push(report);
  return report;
}

const findAll = () => reports;
const findById = (id) => reports.find((r) => r.id === id);

module.exports = { STATUSES, CATEGORIES, create, findAll, findById };
