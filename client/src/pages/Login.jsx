import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Alert } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); navigate('/'); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h1>📍 CIRRS</h1>
        <p>Civic / Community Issue Reporting &amp; Routing System</p>
        <ul>
          <li>📷 Report a problem with a photo and its exact location</li>
          <li>🏛️ Staff verify it and route it to the right department</li>
          <li>✅ Get updates and see proof when it is fixed</li>
        </ul>
      </div>
      <form className="card auth-card" onSubmit={submit}>
        <h2>Log in</h2>
        <Alert>{error}</Alert>
        <label>Email<input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        <button className="btn btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="center small">New here? <Link to="/register">Create a citizen account</Link></p>
      </form>
    </div>
  );
}
