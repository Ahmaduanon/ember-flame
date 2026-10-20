import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, SAMPLE_KITCHEN } from '../lib/hazards.ts';
test('sample kitchen flags the obvious hazards', () => {
  const r = evaluate(SAMPLE_KITCHEN); const t = r.findings.map(f => f.title).join('|');
  assert.match(t, /Stove.*Gas cylinder/); assert.match(t, /Stove.*Curtain/); assert.match(t, /Kettle.*Power strip/); assert.equal(r.level, 'critical');
});
test('empty bedroom only lacks safety equipment', () => assert.deepEqual(evaluate({ type: 'bedroom', w: 3, h: 3, items: [] }).findings.map(f => f.id), ['no-detector', 'no-ext']));
test('gas cylinder in a bedroom is critical', () => assert.equal(evaluate({ type: 'bedroom', w: 3, h: 3, items: [{ uid: 1, type: 'gas', x: 1, y: 1 }] }).findings[0].severity, 'critical'));
