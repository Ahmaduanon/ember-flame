import { useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { Layers, RotateCcw, Info, Trash2, Move, Check, X } from 'lucide-react';
import { ITEMS, ROOM_TYPES, SAMPLE_KITCHEN, evaluate, type Item, type Room, type RoomType, type Severity } from '@/lib/hazards';

const COLOR: Record<Severity, string> = {
  critical: 'var(--danger)',
  high: 'var(--amber)',
  medium: '#eab308',
  low: '#38bdf8'
};

const short = Object.fromEntries(ITEMS.map(i => [i.id, i.short]));

export default function Scanner() {
  const [room, setRoom] = useState<Room>({ type: 'kitchen', w: 4, h: 3, items: [] });
  const [sel, setSel] = useState('stove');
  const [uid, setUid] = useState(100);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [draggingUid, setDraggingUid] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragMovedRef = useRef(false);
  const dragStartCoordsRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const result = useMemo(() => evaluate(room), [room]);
  const byUid = new Map(room.items.map(i => [i.uid, i]));
  const num = (v: string, d: number) => Math.min(30, Math.max(1, Number(v) || d));

  const selectedItem = selectedUid !== null ? byUid.get(selectedUid) : null;
  const selectedDef = selectedItem ? ITEMS.find(it => it.id === selectedItem.type) : null;

  function getRoomCoords(clientX: number, clientY: number) {
    if (!svgRef.current) return { x: 0, y: 0 };
    const r = svgRef.current.getBoundingClientRect();
    const x = Math.max(0.1, Math.min(room.w - 0.1, Math.round(((clientX - r.left) / r.width) * room.w * 20) / 20));
    const y = Math.max(0.1, Math.min(room.h - 0.1, Math.round(((clientY - r.top) / r.height) * room.h * 20) / 20));
    return { x, y };
  }

  function handleCanvasClick(e: MouseEvent<SVGSVGElement>) {
    // If we just finished a pointer drag, suppress click
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }

    const { x, y } = getRoomCoords(e.clientX, e.clientY);

    // If an item is currently selected, clicking on an empty spot moves it to this new location!
    if (selectedUid !== null) {
      setRoom(prev => ({
        ...prev,
        items: prev.items.map(it => it.uid === selectedUid ? { ...it, x, y } : it)
      }));
      // Keep it selected so user can see its new spot and make further tweaks or deselect
      return;
    }

    // When no item is selected, clicking an empty space places a new item from the palette
    const it: Item = { uid, type: sel, x, y };
    setUid(uid + 1);
    setRoom(prev => ({ ...prev, items: [...prev.items, it] }));
  }

  function handleItemPointerDown(e: PointerEvent<SVGGElement>, itemUid: number) {
    e.stopPropagation();
    dragMovedRef.current = false;
    dragStartCoordsRef.current = { clientX: e.clientX, clientY: e.clientY };
    setDraggingUid(itemUid);
    setSelectedUid(itemUid);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  function handleItemPointerMove(e: PointerEvent<SVGGElement>, itemUid: number) {
    if (draggingUid !== itemUid) return;

    // Check if pointer has moved enough to qualify as a drag
    if (dragStartCoordsRef.current) {
      const dist = Math.hypot(
        e.clientX - dragStartCoordsRef.current.clientX,
        e.clientY - dragStartCoordsRef.current.clientY
      );
      if (dist > 4) {
        dragMovedRef.current = true;
      }
    }

    if (!dragMovedRef.current) return;

    const { x, y } = getRoomCoords(e.clientX, e.clientY);
    setRoom(prev => ({
      ...prev,
      items: prev.items.map(it => it.uid === itemUid ? { ...it, x, y } : it)
    }));
  }

  function handleItemPointerUp(e: PointerEvent<SVGGElement>, itemUid: number) {
    if (draggingUid === itemUid) {
      setDraggingUid(null);
      dragStartCoordsRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }

  const remove = (u: number) => {
    setRoom(prev => ({ ...prev, items: prev.items.filter(i => i.uid !== u) }));
    if (selectedUid === u) setSelectedUid(null);
  };

  return (
    <>
      <div className="section-intro">
        <div>
          <div className="eyebrow"><span /> FIRE HAZARD SCANNER</div>
          <h1>Find the fire before it starts.</h1>
          <p>Map a room, place or drag items to test safe clearances, and spot risky proximity pairings in real time.</p>
        </div>
        <div className="intro-actions">
          <button className="secondary" onClick={() => { setRoom(SAMPLE_KITCHEN); setUid(100); setSelectedUid(null); }}>
            <Layers size={14} /> Load sample layout
          </button>
          <button className="quiet" onClick={() => { setRoom({ ...room, items: [] }); setSelectedUid(null); }}>
            <RotateCcw size={14} /> Clear plan
          </button>
        </div>
      </div>

      <div className="lab-grid">
        <div className="simulation-column">
          <section className="panel scan-panel">
            <div className="scan-setup">
              <label className="scan-setup-item">
                <span>Type:</span>
                <select aria-label="Room type" value={room.type} onChange={e => setRoom({ ...room, type: e.target.value as RoomType })}>
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="scan-setup-item">
                <span>Width:</span>
                <input type="number" min={1} max={30} step={0.5} value={room.w} onChange={e => setRoom({ ...room, w: num(e.target.value, 4) })} /> m
              </label>
              <label className="scan-setup-item">
                <span>Depth:</span>
                <input type="number" min={1} max={30} step={0.5} value={room.h} onChange={e => setRoom({ ...room, h: num(e.target.value, 3) })} /> m
              </label>
              <span className="scan-setup-count">
                {room.items.length} items placed
              </span>
            </div>

            {/* Item interaction status strip */}
            <div className={'scan-interactive-bar ' + (selectedItem ? 'active' : '')}>
              {selectedItem ? (
                <div className="scan-selected-info">
                  <span className="scan-selected-pill">
                    <Move size={13} />
                    <b>Moving: {selectedDef?.label || selectedItem.type}</b>
                    <small>({selectedItem.x.toFixed(2)}m, {selectedItem.y.toFixed(2)}m)</small>
                  </span>
                  <span className="scan-move-hint">Drag item or tap empty plan to relocate</span>
                  <div className="scan-selected-actions">
                    <button
                      type="button"
                      className="scan-deselect-btn"
                      title="Done moving (Deselect)"
                      onClick={() => setSelectedUid(null)}
                    >
                      <Check size={13} /> Done
                    </button>
                    <button
                      type="button"
                      className="scan-remove-btn"
                      title="Remove this item"
                      onClick={() => remove(selectedItem.uid)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="scan-default-hint">
                  <span className="scan-hint-tag">Tap to place: {ITEMS.find(it => it.id === sel)?.label}</span>
                  <span>Click an existing item to select & move it. Click empty space to place new item.</span>
                </div>
              )}
            </div>

            <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
              <svg
                ref={svgRef}
                className="scan-canvas"
                viewBox={`0 0 ${room.w * 100} ${room.h * 100}`}
                style={{
                  aspectRatio: `${room.w}/${room.h}`,
                  width: '100%',
                  maxHeight: 'min(65vh, 480px)',
                  display: 'block',
                  touchAction: 'none',
                  cursor: draggingUid ? 'grabbing' : selectedUid ? 'crosshair' : 'default'
                }}
                onClick={handleCanvasClick}
                role="img"
                aria-label="Room plan. Tap to place or click and drag items to move."
              >
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--border)" strokeWidth="0.75" strokeOpacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {result.findings.filter(f => f.items.length === 2).map(f => {
                  const a = byUid.get(f.items[0]);
                  const b = byUid.get(f.items[1]);
                  return a && b ? (
                    <g key={f.id}>
                      <line
                        x1={a.x * 100}
                        y1={a.y * 100}
                        x2={b.x * 100}
                        y2={b.y * 100}
                        stroke={COLOR[f.severity]}
                        strokeWidth={3}
                        strokeDasharray="6 4"
                      />
                      <circle cx={(a.x + b.x) * 50} cy={(a.y + b.y) * 50} r={7} fill={COLOR[f.severity]} />
                    </g>
                  ) : null;
                })}

                {room.items.map(i => {
                  const isSelected = selectedUid === i.uid;
                  const isDragging = draggingUid === i.uid;

                  return (
                    <g
                      key={i.uid}
                      onPointerDown={e => handleItemPointerDown(e, i.uid)}
                      onPointerMove={e => handleItemPointerMove(e, i.uid)}
                      onPointerUp={e => handleItemPointerUp(e, i.uid)}
                      onDoubleClick={e => { e.stopPropagation(); remove(i.uid); }}
                      style={{ cursor: isDragging ? 'grabbing' : isSelected ? 'grab' : 'pointer' }}
                    >
                      <title>{`${ITEMS.find(it => it.id === i.type)?.label || i.type} — Drag or click to move; double-click to remove`}</title>

                      {/* Selection / Focus halo */}
                      {isSelected && (
                        <>
                          <circle
                            cx={i.x * 100}
                            cy={i.y * 100}
                            r={38}
                            fill="rgba(44, 182, 125, 0.15)"
                            stroke="var(--mint)"
                            strokeWidth={2.5}
                            strokeDasharray="6 3"
                            className="scan-selected-halo"
                          />
                          <circle
                            cx={i.x * 100}
                            cy={i.y * 100}
                            r={46}
                            fill="none"
                            stroke="var(--mint)"
                            strokeWidth={1}
                            strokeOpacity={0.4}
                          />
                        </>
                      )}

                      {/* Enlarged tap target for effortless touch and mouse capture */}
                      <circle cx={i.x * 100} cy={i.y * 100} r={34} fill="transparent" />
                      <circle
                        cx={i.x * 100}
                        cy={i.y * 100}
                        r={22}
                        className={'scan-dot ' + (isSelected ? 'active' : '')}
                        stroke={isSelected ? 'var(--mint)' : undefined}
                        strokeWidth={isSelected ? 3 : 1}
                      />
                      <text x={i.x * 100} y={i.y * 100 + 4} textAnchor="middle" className="scan-label">
                        {short[i.type]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="scan-canvas-notes">
              <small className="muted">
                {selectedItem
                  ? 'Item selected: drag it across the canvas or click a new position to move it.'
                  : 'Click on empty space to place an item. Click an existing item to move its location.'}
              </small>
              <small className="scan-scale-tag">Scale: 1m = 100px</small>
            </div>

            {/* Mobile Immediate Risk Summary Strip */}
            <div className="scan-mobile-score-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="scan-score-badge" style={{ background: COLOR[result.level] }}>
                  {result.level.toUpperCase()}
                </span>
                <b style={{ fontSize: '13px' }}>Score: {result.score}/100</b>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {result.findings.length} issue{result.findings.length === 1 ? '' : 's'} flagged
              </span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Item Palette (Select to Place)
              </div>
              <div className="scan-palette">
                {ITEMS.map(i => (
                  <button
                    key={i.id}
                    aria-pressed={sel === i.id}
                    className={sel === i.id ? 'active' : ''}
                    onClick={() => { setSel(i.id); setSelectedUid(null); }}
                  >
                    <b>{i.short}</b> {i.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="control-column">
          <section className="panel">
            <div className="panel-heading">
              <h2>Room Risk Score</h2>
              <span className="scan-score" style={{ color: COLOR[result.level] }}>
                {result.score}<small>/100</small>
              </span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: COLOR[result.level], textTransform: 'uppercase', fontWeight: 700, fontSize: '12px' }}>
                {result.level} RISK
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {result.findings.length} issue{result.findings.length === 1 ? '' : 's'} flagged
              </span>
            </div>

            {!room.items.length && (
              <p className="muted" style={{ fontSize: '13px' }}>Place furniture, appliances, and heaters on the plan to screen for fire risks.</p>
            )}

            <div className="scan-findings">
              {result.findings.map(f => (
                <div key={f.id} className="scan-finding" style={{ borderLeftColor: COLOR[f.severity] }}>
                  <b style={{ color: COLOR[f.severity] }}>{f.severity.toUpperCase()}</b>
                  <p>{f.title}</p>
                  <small><b>Fix:</b> {f.fix}</small>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>
              <Info size={14} />
              <span>Rule-based spatial screening, not a certified fire engineering review.</span>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
