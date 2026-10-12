import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';

const LINKS = {
  citizen: [['/', 'Home'], ['/report/new', 'Report an issue'], ['/reports', 'My reports']],
  staff: [['/', 'Home'], ['/reports', 'Triage queue']],
  officer: [['/', 'Home'], ['/reports', 'My assignments']],
  admin: [['/', 'Dashboard'], ['/reports', 'All reports'], ['/admin/users', 'Users'], ['/admin/departments', 'Departments']],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const load = () => api('/notifications').then((d) => setUnread(d.unread)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    window.addEventListener('cirrs:notifications', load);
    return () => { clearInterval(t); window.removeEventListener('cirrs:notifications', load); };
  }, [user]);

  if (!user) return null;
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">📍 CIRRS</Link>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {LINKS[user.role].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
          <NavLink to="/notifications" className="bell">
            🔔{unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
          </NavLink>
        </nav>
        <div className="nav-user">
          <span className="small muted">{user.name} · {user.role}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </div>
      </div>
    </header>
  );
}
