import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { categoryOf, fmtDate } from '../constants';
import { Alert, PriorityTag, Spinner, StatusBadge } from '../components/ui';
import { MapView } from '../components/Map';
import Timeline from '../components/Timeline';
import ReportActions from '../components/ReportActions';

export default function ReportDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { setReport(null); api(`/reports/${id}`).then(setReport).catch((e) => setError(e.message)); }, [id]);

  if (error) return <div className="page"><Alert>{error}</Alert><Link to="/reports">← Back to reports</Link></div>;
  if (!report) return <Spinner />;
  const cat = categoryOf(report.category);

  return (
    <div className="page">
      <Link to="/reports" className="small">← Back to reports</Link>
      {location.state?.created && <Alert type="success">Your report was submitted. Municipal staff will review it shortly, and you will be notified of every update.</Alert>}

      <div className="row between wrap head">
        <h1>{cat.icon} {cat.label} <span className="muted">#{report.id}</span></h1>
        <div className="row gap"><PriorityTag priority={report.priority} /><StatusBadge status={report.status} /></div>
      </div>

      {report.status === 'Rejected' && <Alert>This report was rejected: {report.rejectionReason}</Alert>}

      <div className="grid-2">
        <div>
          <section className="card">
            <img src={report.photo} alt="Reported issue" className="hero-img" />
            <p>{report.description}</p>
            <dl className="meta">
              <div><dt>Reported by</dt><dd>{report.citizenName}</dd></div>
              <div><dt>Reported on</dt><dd>{fmtDate(report.createdAt)}</dd></div>
              <div><dt>Department</dt><dd>{report.departmentName || 'Not assigned yet'}</dd></div>
              <div><dt>Officer</dt><dd>{report.officerName || '—'}</dd></div>
              {report.address && <div><dt>Landmark</dt><dd>{report.address}</dd></div>}
            </dl>
            <MapView lat={report.latitude} lng={report.longitude} />
            <a className="small" target="_blank" rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}>Open in OpenStreetMap ↗</a>
          </section>

          {report.resolution && (
            <section className="card proof">
              <h3>✅ Resolution proof</h3>
              <img src={report.resolution.photo} alt="Resolution proof" className="hero-img" />
              <p>{report.resolution.note}</p>
              <p className="muted small">Completed {fmtDate(report.resolution.completionDate)}</p>
            </section>
          )}
        </div>

        <div>
          <ReportActions report={report} onDone={setReport} />
          <section className="card">
            <h3>Status history</h3>
            <Timeline history={report.history} />
          </section>
        </div>
      </div>
    </div>
  );
}
