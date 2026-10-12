import { useEffect, useState } from 'react';
import { api, fileToDataUrl } from '../api';
import { Alert } from './ui';

// One small form per action the server says this user may take on this report.
export default function ReportActions({ report, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [texts, setTexts] = useState({});
  const t = (a) => texts[a] || '';
  const setT = (a, v) => setTexts((p) => ({ ...p, [a]: v }));
  const [priority, setPriority] = useState(report.priority || 'Medium');
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [deptId, setDeptId] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [proof, setProof] = useState('');

  const actions = report.allowedActions;
  const has = (a) => actions.includes(a);

  useEffect(() => {
    if (!has('assign')) return;
    Promise.all([api('/departments'), api('/users?role=officer')]).then(([d, o]) => {
      setDepartments(d);
      setOfficers(o);
      const suggested = d.find((x) => x.categories.includes(report.category));
      setDeptId(String(report.departmentId || suggested?.id || d[0]?.id || ''));
    }).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id, report.status]);

  async function run(action, body = {}) {
    setBusy(true); setError('');
    try {
      const updated = await api(`/reports/${report.id}/${action}`, { method: 'POST', body });
      setTexts({}); setProof(''); setOfficerId('');
      window.dispatchEvent(new Event('cirrs:notifications'));
      onDone(updated);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!actions.length) return null;
  const deptOfficers = officers.filter((o) => String(o.departmentId) === deptId && o.active);

  return (
    <section className="card actions">
      <h3>Actions</h3>
      <Alert>{error}</Alert>

      {has('verify') && (
        <div className="action">
          <label>Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <button className="btn" disabled={busy} onClick={() => run('verify', { priority })}>✔ Verify report</button>
        </div>
      )}

      {has('assign') && (
        <div className="action">
          <label>{report.departmentId ? 'Reassign to department' : 'Assign to department'}
            <select value={deptId} onChange={(e) => { setDeptId(e.target.value); setOfficerId(''); }}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label>Officer (optional)
            <select value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
              <option value="">Any officer in the department</option>
              {deptOfficers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <button className="btn" disabled={busy || !deptId}
            onClick={() => run('assign', { departmentId: Number(deptId), officerId: officerId ? Number(officerId) : undefined })}>
            📨 {report.departmentId ? 'Reassign' : 'Assign department'}
          </button>
        </div>
      )}

      {has('accept') && (
        <div className="action">
          <p className="muted small">Accepting marks the report as In progress and assigns it to you.</p>
          <button className="btn" disabled={busy} onClick={() => run('accept')}>🛠 Accept &amp; start work</button>
        </div>
      )}

      {has('progress') && (
        <div className="action">
          <label>Progress update
            <textarea rows={2} value={t('progress')} onChange={(e) => setT('progress', e.target.value)} placeholder="e.g. Crew visited the site, material arrives tomorrow" />
          </label>
          <button className="btn btn-secondary" disabled={busy || t('progress').trim().length < 3} onClick={() => run('progress', { note: t('progress') })}>Post update</button>
        </div>
      )}

      {has('resolve') && (
        <div className="action">
          <label>Resolution note
            <textarea rows={2} value={t('resolve')} onChange={(e) => setT('resolve', e.target.value)} placeholder="What was done to fix the issue?" />
          </label>
          <label>Resolution photo (proof)
            <input type="file" accept="image/*" capture="environment"
              onChange={async (e) => { try { setProof(e.target.files[0] ? await fileToDataUrl(e.target.files[0]) : ''); } catch (err) { setError(err.message); } }} />
          </label>
          {proof && <img src={proof} alt="Proof preview" className="preview" />}
          <button className="btn" disabled={busy || t('resolve').trim().length < 5 || !proof} onClick={() => run('resolve', { note: t('resolve'), photo: proof })}>
            ✅ Mark as resolved
          </button>
        </div>
      )}

      {has('close') && (
        <div className="action">
          <p className="muted small">Happy with the fix? Closing confirms the issue is resolved.</p>
          <button className="btn" disabled={busy} onClick={() => run('close')}>👍 Confirm &amp; close</button>
        </div>
      )}

      {has('reopen') && (
        <div className="action">
          <label>Not fixed? Tell us why
            <textarea rows={2} value={t('reopen')} onChange={(e) => setT('reopen', e.target.value)} placeholder="What is still wrong?" />
          </label>
          <button className="btn btn-danger" disabled={busy || t('reopen').trim().length < 5} onClick={() => run('reopen', { reason: t('reopen') })}>↩ Reopen issue</button>
        </div>
      )}

      {has('reject') && (
        <div className="action">
          <label>Reject (fake / duplicate / out of scope)
            <textarea rows={2} value={t('reject')} onChange={(e) => setT('reject', e.target.value)} placeholder="Reason shown to the citizen" />
          </label>
          <button className="btn btn-danger" disabled={busy || t('reject').trim().length < 5} onClick={() => run('reject', { reason: t('reject') })}>✖ Reject report</button>
        </div>
      )}
    </section>
  );
}
