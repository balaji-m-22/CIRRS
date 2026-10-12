import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fileToDataUrl } from '../api';
import { CATEGORIES } from '../constants';
import { Alert } from '../components/ui';
import { MapPicker } from '../components/Map';

export default function NewReport() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');
  const [pos, setPos] = useState(null); // [lat, lng]
  const [gps, setGps] = useState({ state: 'idle', msg: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function detect() {
    if (!navigator.geolocation) return setGps({ state: 'error', msg: 'Your browser does not support GPS. Click on the map to set the location.' });
    setGps({ state: 'loading', msg: 'Detecting your location…' });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos([p.coords.latitude, p.coords.longitude]);
        setGps({ state: 'ok', msg: `Location detected (accuracy about ${Math.round(p.coords.accuracy)} m). Drag the pin if it is slightly off.` });
      },
      (err) => setGps({
        state: 'error',
        msg: err.code === 1
          ? 'Location permission was denied. Allow it in your browser, or click on the map to set the location.'
          : 'Could not detect your location. Click on the map to set it manually.',
      }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  useEffect(detect, []);

  async function onPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    try { setPhoto(await fileToDataUrl(file)); } catch (err) { setError(err.message); }
  }

  const ready = category && description.trim().length >= 10 && photo && pos;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api('/reports', { method: 'POST', body: { category, description, address: address || undefined, latitude: pos[0], longitude: pos[1], photo } });
      navigate(`/reports/${r.id}`, { state: { created: true } });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <form className="page narrow" onSubmit={submit}>
      <h1>Report an issue</h1>
      <p className="muted">Three quick steps: pick a category, add a photo, confirm the location.</p>
      <Alert>{error}</Alert>

      <section className="card">
        <h3>1. What is the problem?</h3>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.value} className={`cat ${category === c.value ? 'on' : ''}`} onClick={() => setCategory(c.value)}>
              <span className="cat-icon">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
        <label>Describe it
          <textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Deep pothole in the left lane near the bus stop, dangerous for two-wheelers" />
          <span className="hint">{description.trim().length < 10 ? `${10 - description.trim().length} more characters needed` : 'Looks good'}</span>
        </label>
      </section>

      <section className="card">
        <h3>2. Add a photo</h3>
        <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        <span className="hint">On a phone this opens the camera. Photos are resized automatically.</span>
        {photo && <img src={photo} alt="Selected issue" className="preview" />}
      </section>

      <section className="card">
        <h3>3. Where is it?</h3>
        <div className={`gps gps-${gps.state}`}>
          <span>{gps.msg}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={detect} disabled={gps.state === 'loading'}>📍 Detect again</button>
        </div>
        <MapPicker position={pos} onChange={(p) => { setPos(p); setGps({ state: 'ok', msg: 'Location set manually.' }); }} />
        {pos && <p className="muted small">Latitude {pos[0].toFixed(5)}, longitude {pos[1].toFixed(5)}</p>}
        <label>Landmark / address (optional)
          <input value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Opposite City Hospital, 2nd Street" />
        </label>
      </section>

      <button className="btn btn-block btn-lg" disabled={!ready || busy}>{busy ? 'Submitting…' : 'Submit report'}</button>
      {!ready && <p className="muted small center">Choose a category, describe the issue, add a photo and set the location to submit.</p>}
    </form>
  );
}
