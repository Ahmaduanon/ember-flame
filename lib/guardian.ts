/** Ember Guardian decision logic (1 Hz). Mirrored in firmware/guardian/guardian_esp32.ino: keep both in sync.
 * Uses particle (PM2.5 ug/m3), optional CO (ppm), temperature slope and flame. Detection is based on deviation from a
 * slow baseline. All constants are unvalidated bench values, not certified thresholds.
 * Release needs: armed switch + two independent evidence classes + sustained evidence. Faults never release. */
export const GCFG = { warmup: 60, watchS: 3, warnS: 5, fireS: 8, clearS: 10, dischargeS: 3, cooldownS: 60, maxDischarges: 2,
  pm: [35, 75], co: [5, 25], slope: [1.5, 4], absTemp: 57, baseAlpha: 0.01, fireScore: 4 };
export type GState = 'warmup' | 'normal' | 'watch' | 'warning' | 'discharging' | 'cooldown' | 'fault';
export type GIn = { temp: number | null; pm25: number | null; co: number | null; flame: boolean; armed: boolean; fault: boolean };
export type GMem = { state: GState; t: number; basePm: number | null; baseCo: number | null; hist: number[]; score: number; classes: number; slope: number; dPm: number; dCo: number;
  watchT: number; warnT: number; fireT: number; clearT: number; coolT: number; dischargeLeft: number; discharges: number; relay: boolean; reason: string };
export const gInit = (t = 0): GMem => ({ state: t >= GCFG.warmup ? 'normal' : 'warmup', t, basePm: null, baseCo: null, hist: [], score: 0, classes: 0, slope: 0, dPm: 0, dCo: 0, watchT: 0, warnT: 0, fireT: 0, clearT: 0, coolT: 0, dischargeLeft: 0, discharges: 0, relay: false, reason: 'Starting up' });
const lvl = (v: number, [a, b]: number[]) => (v >= b ? 2 : v >= a ? 1 : 0);
const RANK: Record<GState, number> = { warmup: 0, normal: 1, watch: 2, warning: 3, discharging: 4, cooldown: 4, fault: 0 };

export function gStep(p: GMem, i: GIn): GMem {
  const m: GMem = { ...p, t: p.t + 1 };
  const pm = i.pm25, temp = i.temp, co = i.co;
  if (i.fault || pm === null || !isFinite(pm) || (temp !== null && !(isFinite(temp) && temp > -20 && temp < 120))) {
    if (m.t < GCFG.warmup) { m.state = 'warmup'; m.reason = 'Sensors warming up'; } else { m.state = 'fault'; m.reason = 'Sensor fault: alarm only, no release'; }
    m.relay = false; return m;
  }
  if (temp !== null) m.hist = [...p.hist, temp].slice(-30);
  const bp = p.basePm ?? pm, bc = co === null ? null : (p.baseCo ?? co);
  m.basePm = bp; m.baseCo = bc; m.dPm = pm - bp; m.dCo = co !== null && bc !== null ? co - bc : 0;
  m.slope = m.hist.length >= 10 ? ((m.hist[m.hist.length - 1] - m.hist[0]) / (m.hist.length - 1)) * 60 : 0;
  const pChem = lvl(m.dPm, GCFG.pm) + lvl(m.dCo, GCFG.co);
  const pHeat = temp !== null && temp >= GCFG.absTemp ? 2 : lvl(m.slope, GCFG.slope);
  const pFlame = i.flame ? 3 : 0;
  m.score = pChem + pHeat + pFlame;
  m.classes = (pChem > 0 ? 1 : 0) + (pHeat > 0 ? 1 : 0) + (pFlame > 0 ? 1 : 0);
  if (m.t < GCFG.warmup) { m.basePm = bp + 0.05 * (pm - bp); if (bc !== null && co !== null) m.baseCo = bc + 0.05 * (co - bc); m.state = 'warmup'; m.relay = false; m.reason = 'Sensors warming up'; return m; }
  if (m.state === 'warmup' || m.state === 'fault') m.state = 'normal';
  m.watchT = m.score >= 1 ? m.watchT + 1 : 0;
  m.warnT = m.score >= 3 && m.classes >= 2 ? m.warnT + 1 : 0;
  m.fireT = m.score >= GCFG.fireScore && m.classes >= 2 ? m.fireT + 1 : 0;
  m.clearT = m.score === 0 ? m.clearT + 1 : 0;
  if (m.state === 'normal' && m.score === 0) { m.basePm = bp + GCFG.baseAlpha * (pm - bp); if (bc !== null && co !== null) m.baseCo = bc + GCFG.baseAlpha * (co - bc); }
  const fire = () => m.fireT >= GCFG.fireS && i.armed && m.discharges < GCFG.maxDischarges;
  const start = () => { m.state = 'discharging'; m.dischargeLeft = GCFG.dischargeS; m.relay = true; m.reason = 'Confirmed pre-fire pattern: releasing suppressant'; };
  if (m.state === 'discharging') { m.dischargeLeft--; m.relay = true; if (m.dischargeLeft <= 0) { m.relay = false; m.state = 'cooldown'; m.coolT = 0; m.discharges++; m.reason = 'Release finished: watching for re-ignition'; } }
  else if (m.state === 'cooldown') { m.relay = false; m.coolT++; if (m.clearT >= GCFG.cooldownS) { m.state = 'normal'; m.discharges = 0; m.reason = 'Cleared'; } else if (m.coolT >= GCFG.cooldownS && fire()) start(); }
  else {
    m.relay = false;
    if (fire()) start();
    else if (m.warnT >= GCFG.warnS && RANK[m.state] < 3) { m.state = 'warning'; m.reason = 'Two sensor types agree: possible micro-combustion'; }
    else if (m.watchT >= GCFG.watchS && RANK[m.state] < 2) { m.state = 'watch'; m.reason = 'One sensor type is elevated'; }
    else if (m.clearT >= GCFG.clearS && m.state !== 'normal') { m.state = 'normal'; m.reason = 'Back to normal'; }
    if (m.state === 'warning' && m.fireT >= GCFG.fireS && !i.armed) m.reason = 'Pre-fire pattern confirmed but system is DISARMED: no release';
  }
  if (m.state === 'normal' && m.score === 0) m.reason = 'All clear';
  return m;
}
