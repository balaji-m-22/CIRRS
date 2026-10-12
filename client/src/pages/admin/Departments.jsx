import { useEffect, useState } from 'react';
import { api } from '../../api';
import { CATEGORIES, categoryOf } from '../../constants';
import { Alert, Spinner } from '../../components/ui';

export default function Departments() {
  const [depts, setDepts] = useState(null);
  const [edit, setEdit] = useState(null); // {id?, name, categories}
  const [error, setError] = useState('');

  const load = () => api('/departments').then(setDepts).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const toggleCat = (c) => setEdit({ ...edit, categories: edit.categories.includes(c) ? edit.categories.filter((x) => x !== c) : [...edit.categories, c] });

  async function save(e) {
    e.preventDefault(); setError('');
    try {
      const body = { name: edit.name, categories: edit.categories };
      if (edit.id) await api(`/departments/${edit.id}`, { method: 'PATCH', body });
      else await api('/departments', { method: 'POST', body });
      setEdit(null); load();
    } catch (err) { setError(err.message); }
  }
  async function remove(d) {
    if (!window.confirm(`Delete ${d.name}?`)) return;
    setError('');
    try { await api(`/departments/${d.id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  }

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Departments</h1>
        <button className="btn" onClick={() => setEdit({ name: '', categories: [] })}>+ New department</button>
      </div>
      <Alert>{error}</Alert>

      {edit && (
        <form className="card" onSubmit={save}>
          <h3>{edit.id ? 'Edit department' : 'New department'}</h3>
          <label>Name<input required autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <div className="label">Issue categories it handles</div>
          <div className="row gap wrap">
            {CATEGORIES.map((c) => (
              <label key={c.value} className="check"><input type="checkbox" checked={edit.categories.includes(c.value)} onChange={() => toggleCat(c.value)} />{c.icon} {c.label}</label>
            ))}
          </div>
          <div className="row gap"><button className="btn">Save</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}

      {!depts ? <Spinner /> : (
        <div className="list">
          {depts.map((d) => (
            <div key={d.id} className="card row between wrap">
              <div>
                <strong>{d.name}</strong>
                <div className="muted small">{d.categories.length ? d.categories.map((c) => categoryOf(c).label).join(', ') : 'No default categories'}</div>
              </div>
              <div className="row gap">
                <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ ...d })}>Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(d)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
