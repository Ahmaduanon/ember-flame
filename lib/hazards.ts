/** Ember Hazard Scanner: deterministic rule engine for fire-hazard adjacency.
 * Distances are centre-to-centre in metres. Thresholds are conservative rules of thumb
 * (not a code-compliance audit). */
export type RoomType = 'kitchen' | 'bedroom' | 'living' | 'office' | 'bathroom' | 'store' | 'workshop';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Tag = 'heat' | 'combustible' | 'fuel' | 'electric' | 'appliance' | 'safety' | 'door';
export type ItemDef = { id: string; label: string; short: string; tags: Tag[] };
export type Item = { uid: number; type: string; x: number; y: number };
export type Room = { type: RoomType; w: number; h: number; items: Item[] };
export type Finding = { id: string; severity: Severity; title: string; fix: string; items: number[] };

export const ROOM_TYPES: RoomType[] = ['kitchen', 'bedroom', 'living', 'office', 'bathroom', 'store', 'workshop'];
export const ITEMS: ItemDef[] = [
  { id: 'stove', label: 'Stove / cooker', short: 'ST', tags: ['heat'] },
  { id: 'oven', label: 'Oven', short: 'OV', tags: ['heat'] },
  { id: 'heater', label: 'Space heater', short: 'HT', tags: ['heat', 'appliance'] },
  { id: 'iron', label: 'Iron', short: 'IR', tags: ['heat', 'appliance'] },
  { id: 'kettle', label: 'Kettle / toaster', short: 'KT', tags: ['heat', 'appliance'] },
  { id: 'candle', label: 'Candle / lamp flame', short: 'CD', tags: ['heat'] },
  { id: 'fireplace', label: 'Fireplace / fire pit', short: 'FP', tags: ['heat'] },
  { id: 'generator', label: 'Generator', short: 'GN', tags: ['heat', 'fuel'] },
  { id: 'socket', label: 'Wall socket', short: 'SK', tags: ['electric'] },
  { id: 'strip', label: 'Power strip / extension', short: 'PS', tags: ['electric'] },
  { id: 'charger', label: 'Charger / adapter', short: 'CH', tags: ['electric'] },
  { id: 'curtain', label: 'Curtain', short: 'CU', tags: ['combustible'] },
  { id: 'wood', label: 'Wood / furniture', short: 'WD', tags: ['combustible'] },
  { id: 'paper', label: 'Paper / cardboard', short: 'PP', tags: ['combustible'] },
  { id: 'sofa', label: 'Sofa / mattress', short: 'SF', tags: ['combustible'] },
  { id: 'clothes', label: 'Clothes / fabric', short: 'CL', tags: ['combustible'] },
  { id: 'gas', label: 'Gas cylinder', short: 'GC', tags: ['fuel'] },
  { id: 'liquid', label: 'Petrol / flammable liquid', short: 'FL', tags: ['fuel'] },
  { id: 'aerosol', label: 'Aerosol / paint', short: 'AE', tags: ['fuel'] },
  { id: 'detector', label: 'Smoke detector', short: 'SD', tags: ['safety'] },
  { id: 'extinguisher', label: 'Fire extinguisher', short: 'FX', tags: ['safety'] },
  { id: 'door', label: 'Door / exit', short: 'DR', tags: ['door'] },
];
const DEF: Record<string, ItemDef> = Object.fromEntries(ITEMS.map(d => [d.id, d]));
const has = (it: Item, tag: Tag) => DEF[it.type]?.tags.includes(tag) ?? false;
const dist = (a: Item, b: Item) => Math.hypot(a.x - b.x, a.y - b.y);
const lab = (it: Item) => DEF[it.type]?.label ?? it.type;

type PairRule = { id: string; a: (i: Item) => boolean; b: (i: Item) => boolean; max: number; sev: (d: number) => Severity; title: (a: Item, b: Item, d: number) => string; fix: string };
const T = (a: Item, b: Item, d: number, tail: string) => `${lab(a)} is ${d.toFixed(2)} m from ${lab(b)}${tail}`;
const PAIRS: PairRule[] = [
  { id: 'heat-combustible', a: i => has(i, 'heat'), b: i => has(i, 'combustible'), max: 1, sev: d => (d < 0.5 ? 'critical' : 'high'), title: (a, b, d) => T(a, b, d, ' (ignition risk)'), fix: 'Keep at least 1 m clear between heat sources and anything that burns.' },
  { id: 'heat-fuel', a: i => has(i, 'heat'), b: i => has(i, 'fuel') && !has(i, 'heat'), max: 2, sev: () => 'critical', title: (a, b, d) => T(a, b, d, ' (fuel/vapour ignition)'), fix: 'Move fuels, gas and aerosols at least 2 m from any flame or hot surface.' },
  { id: 'electric-combustible', a: i => has(i, 'electric'), b: i => has(i, 'combustible'), max: 0.4, sev: d => (d < 0.2 ? 'high' : 'medium'), title: (a, b, d) => T(a, b, d, ' (arcing/overheating contact)'), fix: 'Leave about 0.5 m of clearance around sockets, strips and chargers.' },
  { id: 'appliance-strip', a: i => has(i, 'appliance'), b: i => i.type === 'strip', max: 1.2, sev: () => 'high', title: (a, b, d) => T(a, b, d, ' (high-wattage load on a strip)'), fix: 'Plug heaters, irons, kettles and toasters straight into a wall socket, never a strip.' },
  { id: 'strip-chain', a: i => i.type === 'strip', b: i => i.type === 'strip', max: 1.5, sev: () => 'high', title: (a, b, d) => T(a, b, d, ' (possible daisy-chaining)'), fix: 'Never plug one extension into another. Use one rated strip or add a socket.' },
  { id: 'electric-heat', a: i => has(i, 'electric'), b: i => has(i, 'heat') && !has(i, 'appliance'), max: 0.5, sev: () => 'medium', title: (a, b, d) => T(a, b, d, ' (cable/insulation heat damage)'), fix: 'Route cables and sockets away from stoves, ovens and open flames.' },
];

const PEN: Record<Severity, number> = { critical: 30, high: 18, medium: 8, low: 3 };
export function evaluate(room: Room) {
  const f: Finding[] = [];
  const its = room.items;
  for (const r of PAIRS) {
    for (let i = 0; i < its.length; i++) for (let j = 0; j < its.length; j++) {
      if (i === j) continue;
      const a = its[i], b = its[j];
      if (!r.a(a) || !r.b(b)) continue;
      if (r.id === 'strip-chain' && a.uid > b.uid) continue; // report each pair once
      const d = dist(a, b);
      if (d < r.max) f.push({ id: `${r.id}-${a.uid}-${b.uid}`, severity: r.sev(d), title: r.title(a, b, d), fix: r.fix, items: [a.uid, b.uid] });
    }
  }
  const count = (t: string) => its.filter(i => i.type === t);
  if (!count('detector').length) f.push({ id: 'no-detector', severity: 'high', title: 'No smoke detector in this room', fix: 'Install a smoke detector on the ceiling, away from cooking steam.', items: [] });
  if (!count('extinguisher').length) f.push({ id: 'no-ext', severity: ['bedroom', 'bathroom'].includes(room.type) ? 'low' : 'medium', title: 'No fire extinguisher in this room', fix: 'Keep a rated extinguisher near the exit, not beside the hazard.', items: [] });
  if (['bedroom', 'bathroom'].includes(room.type)) for (const g of count('gas')) f.push({ id: `gas-${g.uid}`, severity: 'critical', title: `Gas cylinder inside a ${room.type}`, fix: 'Store gas cylinders upright, outdoors or in a ventilated area, never in sleeping or wet rooms.', items: [g.uid] });
  if (!['store', 'workshop'].includes(room.type)) for (const l of count('liquid')) f.push({ id: `liq-${l.uid}`, severity: 'high', title: `Flammable liquid kept in a ${room.type}`, fix: 'Keep petrol and solvents in a ventilated, sealed outdoor store.', items: [l.uid] });
  const doors = count('door');
  for (const d of doors) for (const o of its) if (o.type !== 'door' && dist(d, o) < 1) f.push({ id: `exit-${d.uid}-${o.uid}`, severity: 'medium', title: `${lab(o)} is blocking the exit (${dist(d, o).toFixed(2)} m)`, fix: 'Keep a 1 m clear path to every exit.', items: [d.uid, o.uid] });
  const load = its.reduce((n, i) => n + (i.type === 'strip' ? 3 : has(i, 'electric') ? 1 : 0) + (has(i, 'appliance') ? 2 : 0), 0);
  if (load > 10) f.push({ id: 'overload', severity: 'medium', title: 'Heavy electrical load in one room', fix: 'Spread appliances across circuits and have wiring checked by an electrician.', items: [] });
  const order: Severity[] = ['critical', 'high', 'medium', 'low'];
  f.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  const score = Math.max(0, 100 - f.reduce((n, x) => n + PEN[x.severity], 0));
  const level: Severity = score >= 85 ? 'low' : score >= 60 ? 'medium' : score >= 35 ? 'high' : 'critical';
  return { findings: f, score, level };
}
export const SAMPLE_KITCHEN: Room = { type: 'kitchen', w: 4, h: 3, items: [
  { uid: 1, type: 'stove', x: 1, y: 0.4 }, { uid: 2, type: 'curtain', x: 1.5, y: 0.3 }, { uid: 3, type: 'wood', x: 0.6, y: 0.9 },
  { uid: 4, type: 'socket', x: 2.4, y: 0.3 }, { uid: 5, type: 'strip', x: 2.55, y: 0.45 }, { uid: 6, type: 'kettle', x: 2.9, y: 0.5 },
  { uid: 7, type: 'strip', x: 3.2, y: 0.6 }, { uid: 8, type: 'gas', x: 1.3, y: 0.7 }, { uid: 9, type: 'door', x: 3.5, y: 2.9 }, { uid: 10, type: 'paper', x: 3.3, y: 2.5 },
] };
