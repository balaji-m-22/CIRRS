import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl: icon, iconRetinaUrl: icon2x, shadowUrl: shadow });

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; OpenStreetMap contributors';

// Map where the citizen can click or drag the pin to fine-tune the location
export function MapPicker({ position, onChange, zoom }) {
  const el = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    map.current = L.map(el.current).setView(position || [20.59, 78.96], position ? zoom || 17 : 5);
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map.current);
    map.current.on('click', (e) => cb.current([e.latlng.lat, e.latlng.lng]));
    return () => map.current.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!position) return;
    if (!marker.current) {
      marker.current = L.marker(position, { draggable: true }).addTo(map.current);
      marker.current.on('dragend', () => { const p = marker.current.getLatLng(); cb.current([p.lat, p.lng]); });
    } else marker.current.setLatLng(position);
    map.current.setView(position, Math.max(map.current.getZoom(), 16));
  }, [position]);

  return <div ref={el} className="map" />;
}

// Read-only map for a report's location
export function MapView({ lat, lng }) {
  const el = useRef(null);
  useEffect(() => {
    const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 16);
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(m);
    L.marker([lat, lng]).addTo(m);
    return () => m.remove();
  }, [lat, lng]);
  return <div ref={el} className="map map-sm" />;
}
