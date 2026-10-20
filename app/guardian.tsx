import { useEffect, useRef, useState } from 'react';
import { GCFG, gInit, gStep, type GIn, type GMem, type GState } from '@/lib/guardian';

const COLOR: Record<GState, string> = { warmup: '#9aa5ad', normal: '#8ee0c5', watch: '#8ea8fa', warning: '#f0925a', discharging: '#ff5c5c', cooldown: '#e5c15a', fault: '#c58bff' };
type Scen = 'manual' | 'smoulder' | 'steam' | 'flame';
type Inp = { temp: number; pm25: number; co: number; flame: boolean; armed: boolean; fault: boolean; hasCo: boolean };
const BASE: Inp = { temp: 24, pm25: 8, co: 1, flame: false, armed: true, fault: false, hasCo: true };
const SCEN: Record<Exclude<Scen, 'manual'>, { label: string; fn: (s: number) => Partial<Inp> }> = {
  smoulder: { label: 'Smouldering cable', fn: s => ({ pm25: 8 + Math.min(250, Math.max(0, s - 10) * 6), co: 1 + Math.min(40, Math.max(0, s - 12) * 0.8), temp: 24 + Math.min(30, Math.max(0, s - 15) * 0.12) }) },
  steam: { label: 'Cooking steam (false-alarm test)', fn: s => ({ pm25: s >= 5 && s < 9 ? 60 : 8 }) },
  flame: { label: 'Open flame', fn: s => ({ flame: s >= 5, pm25: 8 + Math.min(200, Math.max(0, s - 8) * 20) }) },
};
const toIn = (x: Inp): GIn => ({ temp: x.temp, pm25: x.pm25, co: x.hasCo ? x.co : null, flame: x.flame, armed: x.armed, fault: x.fault });
const Meter = ({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) =>
  <div className="g-meter"><span>{label}</span><div><i style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}/></div><b>{value.toFixed(1)}{unit}</b></div>;

export default function Guardian() {
  const [inp, setInp] = useState<Inp>(BASE);
  const [scen, setScen] = useState<Scen>('manual');
  const [run, setRun] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [mem, setMem] = useState<GMem>(() => gInit(GCFG.warmup));
  const [log, setLog] = useState<string[]>([]);
  const [live, setLive] = useState<any>(null);
  const [serial, setSerial] = useState(false);
  const [err, setErr] = useState('');
  const memRef = useRef(mem), sRef = useRef(0), inpRef = useRef(inp), scenRef = useRef(scen), lastLive = useRef('');
  inpRef.current = inp; scenRef.current = scen;

  useEffect(() => {
    if (!run || serial) return;
    const id = setInterval(() => {
      const cur = inpRef.current, sc = scenRef.current;
      let x = cur;
      if (sc !== 'manual') { sRef.current++; x = { ...BASE, armed: cur.armed, hasCo: cur.hasCo, fault: cur.fault, ...SCEN[sc].fn(sRef.current) }; setInp(x); }
      const prev = memRef.current, next = gStep(prev, toIn(x));
      memRef.current = next; setMem(next);
      if (next.state !== prev.state) setLog(l => [`+${next.t - GCFG.warmup}s ${next.state}: ${next.reason}`, ...l].slice(0, 12));
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [run, speed, serial]);

  function start(sc: Scen) {
    sRef.current = 0; memRef.current = gInit(GCFG.warmup); setMem(memRef.current);
    setScen(sc); setInp({ ...BASE, armed: inp.armed, hasCo: inp.hasCo, fault: false }); setLog([]); setRun(true);
  }
  async function connect() {
    try {
      const nav = navigator as any;
      if (!nav.serial) { setErr('USB connection needs Chrome or Edge on a computer.'); return; }
      const port = await nav.serial.requestPort(); await port.open({ baudRate: 115200 });
      setSerial(true); setErr(''); setLog([]);
      const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += value; const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const ln of lines) { try { const j = JSON.parse(ln); if (j.guardian_state) { setLive(j); if (j.guardian_state !== lastLive.current) { lastLive.current = j.guardian_state; setLog(l => [`${new Date().toLocaleTimeString()} ${j.guardian_state}`, ...l].slice(0, 12)); } } } catch { /* partial line */ } }
      }
    } catch (e: any) { setErr(e?.message || 'Could not open the device.'); }
    setSerial(false); setLive(null);
  }

  const v = live ? { state: live.guardian_state as GState, pm: live.pm25_ugm3 ?? 0, co: typeof live.co_ppm === 'number' ? live.co_ppm : null, temp: live.ambient_c ?? 0, score: live.guardian_score ?? 0, relay: live.guardian_state === 'discharging', reason: `Live from ${live.device_id || 'device'}` }
    : { state: mem.state, pm: inp.pm25, co: inp.hasCo ? inp.co : null, temp: inp.temp, score: mem.score, relay: mem.relay, reason: mem.reason };
  const manual = scen === 'manual' && !serial;
  const set = (k: keyof Inp, val: number | boolean) => setInp({ ...inp, [k]: val });

  return <>
    <div className="section-intro"><div><div className="eyebrow"><span/> GUARDIAN</div><h1>Catch smouldering before it becomes flame.</h1><p>Particles, heat, flame (and optional CO) must agree before anything is released. Run a scenario or connect the real unit.</p></div>
      <button className="secondary" onClick={connect} disabled={serial}>{serial ? 'Device connected' : 'Connect device (USB)'}</button></div>
    {err && <p role="alert" style={{ color: '#ff8a8a' }}>{err}</p>}
    <div className="lab-grid"><div className="simulation-column">
      <section className="panel g-panel">
        <div className="g-state" style={{ borderColor: COLOR[v.state], color: COLOR[v.state] }}><b>{v.state}</b><span>{v.reason}</span></div>
        <Meter label="Particles PM2.5" value={v.pm} max={300} unit=" µg/m³"/>
        {v.co !== null && <Meter label="CO" value={v.co} max={60} unit=" ppm"/>}
        <Meter label="Temperature" value={v.temp} max={80} unit=" °C"/>
        <Meter label="Evidence score" value={v.score} max={9} unit=""/>
        <div className={`g-relay${v.relay ? ' on' : ''}`}>{v.relay ? 'Suppressant release ACTIVE' : 'Suppressant release idle'}{!serial && ' (simulated)'}</div>
        <div className="scan-findings">{log.length ? log.map((l, i) => <div key={i} className="scan-finding" style={{ borderLeftColor: '#8ee0c5' }}>{l}</div>) : <p className="muted">State changes appear here.</p>}</div>
      </section></div>
      <aside className="control-column"><section className="panel g-panel">
        <div className="panel-heading"><h2>{serial ? 'Live device' : 'Simulator'}</h2></div>
        {!serial && <div className="scan-palette">
          <button className={scen === 'manual' ? 'active' : ''} onClick={() => start('manual')}>Manual</button>
          {(Object.keys(SCEN) as Exclude<Scen, 'manual'>[]).map(k => <button key={k} className={scen === k ? 'active' : ''} onClick={() => start(k)}>{SCEN[k].label}</button>)}
        </div>}
        {!serial && <>
          <label className="g-row">PM2.5 {inp.pm25.toFixed(0)} µg/m³<input type="range" min={0} max={300} disabled={!manual} value={inp.pm25} onChange={e => set('pm25', +e.target.value)}/></label>
          <label className="g-row">CO {inp.co.toFixed(0)} ppm<input type="range" min={0} max={60} disabled={!manual || !inp.hasCo} value={inp.co} onChange={e => set('co', +e.target.value)}/></label>
          <label className="g-row">Temp {inp.temp.toFixed(1)} °C<input type="range" min={15} max={90} step={0.5} disabled={!manual} value={inp.temp} onChange={e => set('temp', +e.target.value)}/></label>
          <label className="g-row"><span><input type="checkbox" disabled={!manual} checked={inp.flame} onChange={e => set('flame', e.target.checked)}/> Flame seen</span></label>
          <label className="g-row"><span><input type="checkbox" checked={inp.hasCo} onChange={e => set('hasCo', e.target.checked)}/> CO sensor fitted</span></label>
          <label className="g-row"><span><input type="checkbox" checked={inp.fault} onChange={e => set('fault', e.target.checked)}/> Simulate sensor fault</span></label>
          <label className="g-row"><span><input type="checkbox" checked={inp.armed} onChange={e => set('armed', e.target.checked)}/> Armed (switch on)</span></label>
          <div className="scan-setup"><button className="secondary" onClick={() => setRun(!run)}>{run ? 'Pause' : 'Resume'}</button>
            <select aria-label="Speed" value={speed} onChange={e => setSpeed(+e.target.value)}><option value={1}>1x</option><option value={4}>4x</option><option value={10}>10x</option></select></div>
        </>}
        <small className="muted">Release needs: armed + two evidence types + {GCFG.fireS} s sustained. Max {GCFG.maxDischarges} releases, then {GCFG.cooldownS} s lockout. Sensor faults never release.</small>
      </section></aside></div>
  </>;
}
