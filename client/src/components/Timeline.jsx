import { fmtDate, STATUS_LABEL } from '../constants';

export default function Timeline({ history }) {
  return (
    <ol className="timeline">
      {[...history].reverse().map((h, i) => (
        <li key={i}>
          <span className={`tl-dot st-${h.status}`} />
          <div>
            <strong>{h.event === 'Progress' ? 'Progress update' : STATUS_LABEL[h.event] || h.event}</strong>
            <span className="muted small"> · {fmtDate(h.at)}{h.byName ? ` · ${h.byName}` : ''}</span>
            {h.note && <div className="tl-note">{h.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
