import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { CATEGORIES, STATUSES, STATUS_LABEL } from '../constants';
import { Alert, Empty, ReportCard, Spinner, Stat } from '../components/ui';

function Bars({ data, labelOf = (k) => k, cls = () => '' }) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div className="bars">
      {Object.entries(data).map(([k, v]) => (
        <div className="bar-row" key={k}>
          <span className="bar-label">{labelOf(k)}</span>
          <div className="bar-track"><div className={`bar-fill ${cls(k)}`} style={{ width: `${(v / max) * 100}%` }} /></div>
          <span className="bar-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

function AdminStats() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/stats').then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!s) return <Spinner />;
  const max = Math.max(1, ...s.last14Days.map((d) => d.count));
  return (
    <>
      <div className="stats">
        <Stat label="Total reports" value={s.total} />
        <Stat label="Open" value={s.open} tone="warn" />
        <Stat label="Resolved / closed" value={s.resolvedCount} tone="good" />
        <Stat label="Avg. time to resolve" value={s.avgResolutionHours === null ? '—' : `${s.avgResolutionHours} h`} />
      </div>
      <div className="grid-2">
        <section className="card"><h3>By status</h3>
          <Bars data={s.byStatus} labelOf={(k) => STATUS_LABEL[k]} cls={(k) => `st-${k}`} /></section>
        <section className="card"><h3>By category</h3>
          <Bars data={s.byCategory} labelOf={(k) => CATEGORIES.find((c) => c.value === k)?.label || k} /></section>
        <section className="card"><h3>By department</h3>
          <Bars data={s.byDepartment} /></section>
        <section className="card"><h3>Reports in the last 14 days</h3>
          <div className="spark">
            {s.last14Days.map((d) => (
              <div key={d.date} className="spark-col" title={`${d.date}: ${d.count}`}>
                <div className="spark-bar" style={{ height: `${(d.count / max) * 100}%` }} />
                <span>{d.date.slice(8)}</span>
              </div>
            ))}
          </div></section>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/reports').then(setReports).catch((e) => setError(e.message)); }, []);

  const n = (fn) => (reports || []).filter(fn).length;
  const need = (reports || []).filter((r) => r.allowedActions.length > 0);
  const hello = `Hello, ${user.name.split(' ')[0]} 👋`;

  return (
    <div className="page">
      <h1>{user.role === 'admin' ? 'Dashboard' : hello}</h1>
      <Alert>{error}</Alert>

      {user.role === 'citizen' && (
        <section className="card cta">
          <div><h2>See something that needs fixing?</h2><p className="muted">Report it in under a minute with a photo and your location.</p></div>
          <Link className="btn btn-lg" to="/report/new">+ Report an issue</Link>
        </section>
      )}

      {user.role === 'admin' && <AdminStats />}

      {user.role !== 'admin' && reports && (
        <div className="stats">
          {user.role === 'citizen' && <>
            <Stat label="My reports" value={reports.length} />
            <Stat label="In progress" value={n((r) => ['Verified', 'Assigned', 'InProgress'].includes(r.status))} tone="warn" />
            <Stat label="Awaiting my confirmation" value={n((r) => r.status === 'Resolved')} tone="good" />
          </>}
          {user.role === 'staff' && <>
            <Stat label="Waiting for verification" value={n((r) => r.status === 'Reported')} tone="warn" />
            <Stat label="Verified, not assigned" value={n((r) => r.status === 'Verified')} tone="warn" />
            <Stat label="Total reports" value={reports.length} />
          </>}
          {user.role === 'officer' && <>
            <Stat label="New assignments" value={n((r) => r.status === 'Assigned')} tone="warn" />
            <Stat label="In progress" value={n((r) => r.status === 'InProgress')} />
            <Stat label="Resolved" value={n((r) => ['Resolved', 'Closed'].includes(r.status))} tone="good" />
          </>}
        </div>
      )}

      {user.role !== 'admin' && (
        <>
          <div className="row between wrap">
            <h2>{need.length ? 'Needs your attention' : 'Recent reports'}</h2>
            <Link to="/reports" className="small">View all →</Link>
          </div>
          {!reports ? <Spinner /> : (need.length ? need : reports).length === 0 ? (
            <Empty title="Nothing here yet">{user.role === 'citizen' ? 'Your reports will appear here.' : 'New work will appear here.'}</Empty>
          ) : (
            <div className="list">{(need.length ? need : reports).slice(0, 5).map((r) => <ReportCard key={r.id} report={r} />)}</div>
          )}
        </>
      )}
      {user.role === 'admin' && reports && STATUSES && (
        <>
          <div className="row between wrap"><h2>Latest reports</h2><Link to="/reports" className="small">View all →</Link></div>
          <div className="list">{reports.slice(0, 4).map((r) => <ReportCard key={r.id} report={r} />)}</div>
        </>
      )}
    </div>
  );
}
