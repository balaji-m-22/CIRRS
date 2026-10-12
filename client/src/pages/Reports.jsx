import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, download } from '../api';
import { useAuth } from '../auth';
import { CATEGORIES, STATUSES, STATUS_LABEL } from '../constants';
import { Alert, Empty, ReportCard, Spinner } from '../components/ui';

const TITLES = { citizen: 'My reports', staff: 'Triage queue', officer: 'My assignments', admin: 'All reports' };

export default function Reports() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const status = params.get('status') || '';
  const category = params.get('category') || '';
  const setFilter = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  useEffect(() => { api('/reports').then(setReports).catch((e) => setError(e.message)); }, []);

  const shown = useMemo(() => (reports || []).filter((r) =>
    (!status || r.status === status) &&
    (!category || r.category === category) &&
    (!q || `${r.id} ${r.description} ${r.address} ${r.departmentName || ''}`.toLowerCase().includes(q.toLowerCase()))), [reports, status, category, q]);

  const counts = useMemo(() => {
    const c = {};
    (reports || []).forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [reports]);

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>{TITLES[user.role]}</h1>
        <div className="row gap">
          {user.role === 'citizen' && <Link className="btn" to="/report/new">+ Report an issue</Link>}
          {(user.role === 'admin' || user.role === 'staff') && (
            <button className="btn btn-secondary" onClick={() => download('/reports/export.csv', 'cirrs-reports.csv').catch((e) => setError(e.message))}>⬇ Export CSV</button>
          )}
        </div>
      </div>
      <Alert>{error}</Alert>

      <div className="chips">
        <button className={`chip ${!status ? 'on' : ''}`} onClick={() => setFilter('status', '')}>All ({reports?.length ?? 0})</button>
        {STATUSES.filter((s) => counts[s]).map((s) => (
          <button key={s} className={`chip ${status === s ? 'on' : ''}`} onClick={() => setFilter('status', s)}>{STATUS_LABEL[s]} ({counts[s]})</button>
        ))}
      </div>
      <div className="row gap wrap filters">
        <input type="search" placeholder="Search description, id, department…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={category} onChange={(e) => setFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {!reports ? <Spinner /> : shown.length === 0 ? (
        <Empty title="No reports here">
          {reports.length === 0
            ? user.role === 'citizen' ? 'You have not reported anything yet.' : 'Nothing has been reported or assigned yet.'
            : 'Try changing the filters.'}
        </Empty>
      ) : (
        <div className="list">{shown.map((r) => <ReportCard key={r.id} report={r} />)}</div>
      )}
    </div>
  );
}
