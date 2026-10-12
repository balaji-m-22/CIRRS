import { STATUS_LABEL, categoryOf, timeAgo } from '../constants';
import { Link } from 'react-router-dom';

export const StatusBadge = ({ status }) => <span className={`badge st-${status}`}>{STATUS_LABEL[status] || status}</span>;

export const PriorityTag = ({ priority }) => <span className={`tag pr-${priority}`}>{priority} priority</span>;

export const Alert = ({ type = 'error', children }) =>
  children ? <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</div> : null;

export const Spinner = ({ text = 'Loading…' }) => <div className="center muted pad">{text}</div>;

export const Empty = ({ icon = '📭', title, children }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p className="muted">{children}</p>
  </div>
);

export function ReportCard({ report }) {
  const cat = categoryOf(report.category);
  return (
    <Link to={`/reports/${report.id}`} className="card report-card">
      <img src={report.photo} alt="" loading="lazy" className="thumb" />
      <div className="rc-body">
        <div className="rc-top">
          <strong>{cat.icon} {cat.label}</strong>
          <StatusBadge status={report.status} />
        </div>
        <p className="rc-desc">{report.description}</p>
        <div className="muted small">
          #{report.id} · {timeAgo(report.createdAt)}
          {report.departmentName ? ` · ${report.departmentName}` : ''}
        </div>
      </div>
    </Link>
  );
}

export const Stat = ({ label, value, tone }) => (
  <div className={`card stat ${tone || ''}`}>
    <div className="stat-value">{value}</div>
    <div className="muted small">{label}</div>
  </div>
);
