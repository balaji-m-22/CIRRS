export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole / road damage', icon: '🕳️' },
  { value: 'streetlight', label: 'Streetlight not working', icon: '💡' },
  { value: 'garbage', label: 'Garbage / waste', icon: '🗑️' },
  { value: 'water', label: 'Water / drainage', icon: '💧' },
  { value: 'other', label: 'Other', icon: '📌' },
];
export const categoryOf = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[4];

export const STATUS_LABEL = {
  Reported: 'Reported', Verified: 'Verified', Assigned: 'Assigned', InProgress: 'In progress',
  Resolved: 'Resolved', Closed: 'Closed', Rejected: 'Rejected',
};
export const STATUSES = Object.keys(STATUS_LABEL);

export const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
export const timeAgo = (iso) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
