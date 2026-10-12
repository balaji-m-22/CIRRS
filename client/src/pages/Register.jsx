import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';
import { Alert } from '../components/ui';

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('/auth/register', { method: 'POST', body: f });
      await login(f.email, f.password); // log in straight away
      navigate('/');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap single">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Create your account</h2>
        <p className="muted small">Citizen accounts let you report issues and track them.</p>
        <Alert>{error}</Alert>
        <label>Full name<input required value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Phone number<input type="tel" required value={f.phone} onChange={set('phone')} placeholder="e.g. 9876543210" autoComplete="tel" /></label>
        <label>Password<input type="password" required minLength={8} value={f.password} onChange={set('password')} autoComplete="new-password" />
          <span className="hint">At least 8 characters</span></label>
        <button className="btn btn-block" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        <p className="center small">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
