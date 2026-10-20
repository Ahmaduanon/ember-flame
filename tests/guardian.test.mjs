import test from 'node:test';
import assert from 'node:assert/strict';
import { gInit, gStep, GCFG } from '../lib/guardian.ts';
import { evaluateDetection } from '../lib/detection.ts';
const run = (fn, armed, secs, t0 = GCFG.warmup) => { let m = gInit(t0); const seen = []; for (let s = 0; s < secs; s++) { m = gStep(m, { temp: 24, pm25: 8, co: null, flame: false, armed, fault: false, ...fn(s) }); if (seen.at(-1) !== m.state) seen.push(m.state); } return { m, seen }; };
const smoulder = s => ({ pm25: 8 + Math.min(250, Math.max(0, s - 10) * 6), temp: 24 + Math.min(30, Math.max(0, s - 15) * 0.12) });
test('idle stays normal', () => assert.deepEqual(run(() => ({}), true, 300).seen, ['normal']));
test('short particle spike never warns or releases', () => { const { seen } = run(s => ({ pm25: s >= 20 && s < 24 ? 60 : 8 }), true, 120); assert.ok(!seen.includes('warning') && !seen.includes('discharging')); });
test('smouldering pattern releases when armed, at most twice', () => { const { m, seen } = run(smoulder, true, 260); assert.ok(seen.includes('discharging')); assert.equal(m.discharges, 2); });
test('disarmed warns but never releases', () => { const { m, seen } = run(smoulder, false, 200); assert.ok(seen.includes('warning')); assert.ok(!seen.includes('discharging')); assert.equal(m.relay, false); });
test('sensor fault never releases', () => { const { seen } = run(() => ({ fault: true, pm25: 300 }), true, 60); assert.deepEqual(seen, ['fault']); });
test('warm-up never releases', () => { const { seen } = run(s => ({ pm25: 300, temp: 24 + s * 0.2 }), true, 50, 0); assert.deepEqual(seen, ['warmup']); });
test('detection engine treats Guardian states and warm-up correctly', () => {
  const now = Date.now(), ev = sample => evaluateDetection([{ at: now, sample: { device_id: 'g', ...sample } }], now);
  assert.equal(ev({ ambient_c: 25, guardian_state: 'discharging' }).state, 'alarm');
  assert.equal(ev({ pm25_ugm3: 10, guardian_state: 'warning' }).state, 'warning');
  const w = ev({ ambient_c: 25, warming_up: true, sensor_fault: false }); assert.equal(w.state, 'collecting'); assert.match(w.details[0], /warming up/);
});
