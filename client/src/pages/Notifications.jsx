import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Alert, Empty, Spinner } from '../components/ui';
import { timeAgo } from '../constants';

export default function Notifications() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/notifications').then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function readAll() {
    await api('/notifications/read-all', { method: 'POST' });
    window.dispatchEvent(new Event('cirrs:notifications'));
    load();
  }
  async function readOne(n) {
    if (n.read) return;
    await api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    window.dispatchEvent(new Event('cirrs:notifications'));
  }

  return (
    <div className="page narrow">
      <div className="row between wrap">
        <h1>Notifications</h1>
        {data?.unread > 0 && <button className="btn btn-secondary btn-sm" onClick={readAll}>Mark all as read</button>}
      </div>
      <Alert>{error}</Alert>
      {!data ? <Spinner /> : data.items.length === 0 ? (
        <Empty icon="🔔" title="No notifications yet">Updates about your reports will show up here.</Empty>
      ) : (
        <div className="list">
          {data.items.map((n) => (
            <Link key={n.id} to={n.reportId ? `/reports/${n.reportId}` : '#'} onClick={() => readOne(n)} className={`card note ${n.read ? '' : 'unread'}`}>
              <span>{n.message}</span>
              <span className="muted small">{timeAgo(n.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
