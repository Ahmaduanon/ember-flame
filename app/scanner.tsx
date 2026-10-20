import { useMemo, useState, type MouseEvent } from 'react';
import { ITEMS, ROOM_TYPES, SAMPLE_KITCHEN, evaluate, type Item, type Room, type RoomType, type Severity } from '@/lib/hazards';

const COLOR: Record<Severity, string> = { critical: '#ff5c5c', high: '#f0925a', medium: '#e5c15a', low: '#8ea8fa' };
const short = Object.fromEntries(ITEMS.map(i => [i.id, i.short]));

export default function Scanner() {
  const [room, setRoom] = useState<Room>({ type: 'kitchen', w: 4, h: 3, items: [] });
  const [sel, setSel] = useState('stove');
  const [uid, setUid] = useState(100);
  const result = useMemo(() => evaluate(room), [room]);
  const byUid = new Map(room.items.map(i => [i.uid, i]));
  const num = (v: string, d: number) => Math.min(30, Math.max(1, Number(v) || d));

  function place(e: MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * room.w * 20) / 20;
    const y = Math.round(((e.clientY - r.top) / r.height) * room.h * 20) / 20;
    const it: Item = { uid, type: sel, x, y };
    setUid(uid + 1);
    setRoom({ ...room, items: [...room.items, it] });
  }
  const remove = (u: number) => setRoom({ ...room, items: room.items.filter(i => i.uid !== u) });

  return <>
    <div className="section-intro"><div><div className="eyebrow"><span/> FIRE HAZARD SCANNER</div><h1>Find the fire before it starts.</h1><p>Map a room, tap to place items, and see risky pairings instantly.</p></div>
      <button className="secondary" onClick={() => { setRoom(SAMPLE_KITCHEN); setUid(100); }}>Load risky sample</button></div>
    <div className="lab-grid"><div className="simulation-column">
      <section className="panel scan-panel">
        <div className="scan-setup">
          <select aria-label="Room type" value={room.type} onChange={e => setRoom({ ...room, type: e.target.value as RoomType })}>{ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <label>W <input type="number" min={1} max={30} step={0.5} value={room.w} onChange={e => setRoom({ ...room, w: num(e.target.value, 4) })}/> m</label>
          <label>D <input type="number" min={1} max={30} step={0.5} value={room.h} onChange={e => setRoom({ ...room, h: num(e.target.value, 3) })}/> m</label>
          <button className="quiet" onClick={() => setRoom({ ...room, items: [] })}>Clear</button>
        </div>
        <svg className="scan-canvas" viewBox={`0 0 ${room.w * 100} ${room.h * 100}`} style={{ aspectRatio: `${room.w}/${room.h}` }} onClick={place} role="img" aria-label="Room plan. Tap to place the selected item.">
          {result.findings.filter(f => f.items.length === 2).map(f => { const a = byUid.get(f.items[0]), b = byUid.get(f.items[1]); return a && b ? <line key={f.id} x1={a.x * 100} y1={a.y * 100} x2={b.x * 100} y2={b.y * 100} stroke={COLOR[f.severity]} strokeWidth={3} strokeDasharray="6 4"/> : null; })}
          {room.items.map(i => <g key={i.uid} onClick={e => { e.stopPropagation(); remove(i.uid); }} style={{ cursor: 'pointer' }}><circle cx={i.x * 100} cy={i.y * 100} r={20} className="scan-dot"/><text x={i.x * 100} y={i.y * 100 + 5} textAnchor="middle" className="scan-label">{short[i.type]}</text></g>)}
        </svg>
        <small className="muted">Tap the plan to place the selected item. Tap an item to remove it. Distances use the plan scale.</small>
        <div className="scan-palette">{ITEMS.map(i => <button key={i.id} aria-pressed={sel === i.id} className={sel === i.id ? 'active' : ''} onClick={() => setSel(i.id)}><b>{i.short}</b> {i.label}</button>)}</div>
      </section></div>
      <aside className="control-column"><section className="panel">
        <div className="panel-heading"><h2>Room risk</h2><span className="scan-score" style={{ color: COLOR[result.level] }}>{result.score}<small>/100</small></span></div>
        <p style={{ color: COLOR[result.level], textTransform: 'uppercase', fontWeight: 600 }}>{result.level} risk · {result.findings.length} issue{result.findings.length === 1 ? '' : 's'}</p>
        {!room.items.length && <p className="muted">Place items to start the scan.</p>}
        <div className="scan-findings">{result.findings.map(f => <div key={f.id} className="scan-finding" style={{ borderLeftColor: COLOR[f.severity] }}><b style={{ color: COLOR[f.severity] }}>{f.severity.toUpperCase()}</b><p>{f.title}</p><small>Fix: {f.fix}</small></div>)}</div>
        <small className="muted">Rule-based screening, not a certified fire inspection.</small>
      </section></aside></div>
  </>;
}
