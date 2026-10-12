import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Alert, Spinner } from '../../components/ui';

const blank = { name: '', email: '', phone: '', password: '', role: 'officer', departmentId: '' };

export default function Users() {
  const [users, setUsers] = useState(null);
  const [depts, setDepts] = useState([]);
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [filter, setFilter] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const load = () => Promise.all([api('/users'), api('/departments')]).then(([u, d]) => { setUsers(u); setDepts(d); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault(); setError(''); setOk('');
    try {
      await api('/users', { method: 'POST', body: { ...f, departmentId: f.role === 'officer' ? Number(f.departmentId) : undefined } });
      setF(blank); setOk('Account created.'); load();
    } catch (err) { setError(err.message); }
  }
  async function toggle(u) {
    setError('');
    try { await api(`/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } }); load(); } catch (err) { setError(err.message); }
  }

  const deptName = (id) => depts.find((d) => d.id === id)?.name || '—';
  const shown = (users || []).filter((u) => !filter || u.role === filter);

  return (
    <div className="page">
      <h1>Users</h1>
      <Alert>{error}</Alert><Alert type="success">{ok}</Alert>

      <form className="card" onSubmit={create}>
        <h3>Add a staff, officer or admin account</h3>
        <div className="form-grid">
          <label>Name<input required value={f.name} onChange={set('name')} /></label>
          <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
          <label>Phone<input required value={f.phone} onChange={set('phone')} /></label>
          <label>Temporary password<input type="password" required minLength={8} value={f.password} onChange={set('password')} /></label>
          <label>Role
            <select value={f.role} onChange={set('role')}>
              <option value="officer">Department officer</option><option value="staff">Municipal staff</option><option value="admin">Administrator</option>
            </select></label>
          {f.role === 'officer' && (
            <label>Department
              <select required value={f.departmentId} onChange={set('departmentId')}>
                <option value="">Select…</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select></label>
          )}
        </div>
        <button className="btn">Create account</button>
      </form>

      <div className="row between wrap">
        <h2>All users</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All roles</option><option value="citizen">Citizens</option><option value="officer">Officers</option>
          <option value="staff">Staff</option><option value="admin">Admins</option>
        </select>
      </div>
      {!users ? <Spinner /> : (
        <div className="table-wrap card">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th /></tr></thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.email}</td><td className="cap">{u.role}</td>
                  <td>{u.role === 'officer' ? deptName(u.departmentId) : '—'}</td>
                  <td>{u.active ? <span className="badge st-Closed">Active</span> : <span className="badge st-Rejected">Deactivated</span>}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}>{u.active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
