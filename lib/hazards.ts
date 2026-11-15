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
  { id: 'stove', label: 'Galley Thermal Heater / Stove', short: 'GH', tags: ['heat'] },
  { id: 'oven', label: 'Materials Heating Furnace / Oven', short: 'MF', tags: ['heat'] },
  { id: 'heater', label: 'ECLSS Cabin Air Duct Heater', short: 'DH', tags: ['heat', 'appliance'] },
  { id: 'iron', label: 'Thermal Sealer / Soldering Iron', short: 'TS', tags: ['heat', 'appliance'] },
  { id: 'kettle', label: 'Food Rehydrator / Kettle', short: 'RH', tags: ['heat', 'appliance'] },
  { id: 'candle', label: 'Solid Fuel Oxygen Candle / Igniter', short: 'OC', tags: ['heat'] },
  { id: 'fireplace', label: 'Combustion Integrated Rack (CIR)', short: 'CR', tags: ['heat'] },
  { id: 'generator', label: 'Fuel Cell Auxiliary Generator', short: 'FC', tags: ['heat', 'fuel'] },
  { id: 'socket', label: 'Avionics 28V DC Utility Bus', short: 'AV', tags: ['electric'] },
  { id: 'strip', label: 'Multi-Tap Umbilical / Power strip', short: 'PS', tags: ['electric'] },
  { id: 'charger', label: 'EVA Tool Battery Fast Charger', short: 'BC', tags: ['electric'] },
  { id: 'curtain', label: 'MLI Thermal Blanket / Curtain', short: 'ML', tags: ['combustible'] },
  { id: 'wood', label: 'Cellulose Panels / Composite Core', short: 'CP', tags: ['combustible'] },
  { id: 'paper', label: 'Flight Logs / Technical Manuals', short: 'FL', tags: ['combustible'] },
  { id: 'sofa', label: 'Crew Sleep Pod Pad / Seat Foam', short: 'SP', tags: ['combustible'] },
  { id: 'clothes', label: 'Nomex / Flight Suit Garments', short: 'FS', tags: ['combustible'] },
  { id: 'gas', label: 'High-Pressure O2 Gas cylinder', short: 'O2', tags: ['fuel'] },
  { id: 'liquid', label: 'Hydrazine Monopropellant / Volatile Fluid', short: 'HZ', tags: ['fuel'] },
  { id: 'aerosol', label: 'Solvent Canister / Pressurized Spray', short: 'SC', tags: ['fuel'] },
  { id: 'detector', label: 'Zero-G Multi-Criteria Smoke Detector', short: 'SD', tags: ['safety'] },
  { id: 'extinguisher', label: 'Fine Water Mist Extinguisher (NASA #9582)', short: 'WM', tags: ['safety'] },
  { id: 'door', label: 'Pressure Airlock Egress Hatch', short: 'EH', tags: ['door'] },
];
const DEF: Record<string, ItemDef> = Object.fromEntries(ITEMS.map(d => [d.id, d]));
const has = (it: Item, tag: Tag) => DEF[it.type]?.tags.includes(tag) ?? false;
const dist = (a: Item, b: Item) => Math.hypot(a.x - b.x, a.y - b.y);
const lab = (it: Item) => DEF[it.type]?.label ?? it.type;

type PairRule = { id: string; a: (i: Item) => boolean; b: (i: Item) => boolean; max: number; sev: (d: number) => Severity; title: (a: Item, b: Item, d: number) => string; fix: string };
const T = (a: Item, b: Item, d: number, tail: string) => `${lab(a)} is ${d.toFixed(2)} m from ${lab(b)}${tail}`;
const PAIRS: PairRule[] = [
  { id: 'heat-combustible', a: i => has(i, 'heat'), b: i => has(i, 'combustible'), max: 1, sev: d => (d < 0.5 ? 'critical' : 'high'), title: (a, b, d) => T(a, b, d, ' (ignition risk)'), fix: 'Maintain at least 1.0 m separation between thermal hardware and combustible MLI or fabrics.' },
  { id: 'heat-fuel', a: i => has(i, 'heat'), b: i => has(i, 'fuel') && !has(i, 'heat'), max: 2, sev: () => 'critical', title: (a, b, d) => T(a, b, d, ' (fuel/vapour ignition)'), fix: 'Relocate high-pressure O2, propellants or volatile canisters at least 2.0 m from heat sources.' },
  { id: 'electric-combustible', a: i => has(i, 'electric'), b: i => has(i, 'combustible'), max: 0.4, sev: d => (d < 0.2 ? 'high' : 'medium'), title: (a, b, d) => T(a, b, d, ' (arcing/overheating contact)'), fix: 'Ensure 0.5 m clearance around avionics power distribution buses, chargers and umbilicals.' },
  { id: 'appliance-strip', a: i => has(i, 'appliance'), b: i => i.type === 'strip', max: 1.2, sev: () => 'high', title: (a, b, d) => T(a, b, d, ' (high-wattage load on a strip)'), fix: 'Route high-draw heaters and rehydrators directly to main 28V DC avionics bus, never an auxiliary strip.' },
  { id: 'strip-chain', a: i => i.type === 'strip', b: i => i.type === 'strip', max: 1.5, sev: () => 'high', title: (a, b, d) => T(a, b, d, ' (possible daisy-chaining)'), fix: 'Never daisy-chain auxiliary power umbilicals per NASA SP-5080 flight wire standards.' },
  { id: 'electric-heat', a: i => has(i, 'electric'), b: i => has(i, 'heat') && !has(i, 'appliance'), max: 0.5, sev: () => 'medium', title: (a, b, d) => T(a, b, d, ' (cable/insulation heat damage)'), fix: 'Keep electrical wire harnesses clear of furnace blocks and high-temperature thermal ducts.' },
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
  if (!count('detector').length) f.push({ id: 'no-detector', severity: 'high', title: 'No smoke detector in this room', fix: 'Install zero-g optical smoke detector near ventilation return grilles per NASA Spinoff #9407.', items: [] });
  if (!count('extinguisher').length) f.push({ id: 'no-ext', severity: ['bedroom', 'bathroom'].includes(room.type) ? 'low' : 'medium', title: 'No fire extinguisher in this room', fix: 'Mount fine water mist fire extinguisher (NASA Spinoff #9582) adjacent to pressure hatch.', items: [] });
  if (['bedroom', 'bathroom'].includes(room.type)) for (const g of count('gas')) f.push({ id: `gas-${g.uid}`, severity: 'critical', title: `Gas cylinder inside a ${room.type}`, fix: 'Store high-pressure gas cylinders in dedicated uncrewed payload or exterior bays, never in crew quarters.', items: [g.uid] });
  if (!['store', 'workshop'].includes(room.type)) for (const l of count('liquid')) f.push({ id: `liq-${l.uid}`, severity: 'high', title: `Flammable liquid kept in a ${room.type}`, fix: 'Store volatile fluids and propellants in hermetically sealed, ventilated payload bays.', items: [l.uid] });
  const doors = count('door');
  for (const d of doors) for (const o of its) if (o.type !== 'door' && dist(d, o) < 1) f.push({ id: `exit-${d.uid}-${o.uid}`, severity: 'medium', title: `${lab(o)} is blocking the exit (${dist(d, o).toFixed(2)} m)`, fix: 'Maintain 1.0 m clear evacuation corridor to the pressure egress hatch per ISS SSP 50005.', items: [d.uid, o.uid] });
  const load = its.reduce((n, i) => n + (i.type === 'strip' ? 3 : has(i, 'electric') ? 1 : 0) + (has(i, 'appliance') ? 2 : 0), 0);
  if (load > 10) f.push({ id: 'overload', severity: 'medium', title: 'Heavy electrical load in one room', fix: 'Distribute payload draws across redundant avionics power buses to prevent overheating.', items: [] });
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
