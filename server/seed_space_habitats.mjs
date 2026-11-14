import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { auditFindingsWithNasa, evaluateFindingNasaBenchmark } from '../lib/nasa-safety-audit.ts';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const photosDir = path.join(dataDir, 'photos');
fs.mkdirSync(photosDir, { recursive: true });

// Source photos in repository
const repoPhotosDir = path.join(root, 'public', 'space-photos');
const spacePhotos = [
  {
    src: path.join(repoPhotosDir, 'artemis_rover_cabin.jpg'),
    dest: path.join(photosDir, 'artemis_rover_cabin.jpg'),
    label: 'Artemis Rover Cockpit & Egress Corridor'
  },
  {
    src: path.join(repoPhotosDir, 'iss_destiny_science_module.jpg'),
    dest: path.join(photosDir, 'iss_destiny_science_module.jpg'),
    label: 'ISS Destiny Module CIR Rack & Suction Grille'
  },
  {
    src: path.join(repoPhotosDir, 'lunar_base_habitat.jpg'),
    dest: path.join(photosDir, 'lunar_base_habitat.jpg'),
    label: 'Lunar Base Crew Quarters & ECLSS Heater Line'
  }
];

for (const p of spacePhotos) {
  if (fs.existsSync(p.src) && p.src !== p.dest) {
    fs.copyFileSync(p.src, p.dest);
    console.log(`Copied ${path.basename(p.dest)} (${Math.round(fs.statSync(p.dest).size / 1024)} KB)`);
  } else if (!fs.existsSync(p.dest)) {
    console.warn(`Source photo not found: ${p.src}`);
  }
}

const db = new DatabaseSync(path.join(dataDir, 'ember.sqlite'));

// Clear old residential dummy rooms (Living room, Kitchen, Home Office)
const oldRooms = db.prepare("SELECT id FROM safety_rooms WHERE payload LIKE '%Living room%' OR payload LIKE '%Kitchen%' OR payload LIKE '%Home Office%'").all();
for (const r of oldRooms) {
  db.prepare('DELETE FROM survey_photos WHERE roomId = ?').run(r.id);
  db.prepare('DELETE FROM findings WHERE roomId = ?').run(r.id);
  db.prepare('DELETE FROM assessments WHERE roomId = ?').run(r.id);
  db.prepare('DELETE FROM safety_rooms WHERE id = ?').run(r.id);
}
console.log(`Removed ${oldRooms.length} old residential test rooms.`);

function upsertSpace({ id, building, kind, name, floor, notes, adjacent, photoPath, photoLabel, findingsData, summaryText, limitations, followUpViews }) {
  const existing = db.prepare('SELECT id FROM safety_rooms WHERE id = ?').get(id);
  const now = Date.now();
  const roomPayload = { building, kind, name, floor, notes, adjacent };

  if (existing) {
    db.prepare('UPDATE safety_rooms SET payload = ? WHERE id = ?').run(JSON.stringify(roomPayload), id);
  } else {
    db.prepare('INSERT INTO safety_rooms(id, createdAt, payload) VALUES(?,?,?)').run(id, now, JSON.stringify(roomPayload));
  }

  // Set photo
  let photoId = null;
  db.prepare('DELETE FROM survey_photos WHERE roomId = ?').run(id);
  if (photoPath && fs.existsSync(photoPath)) {
    const buf = fs.readFileSync(photoPath);
    const dataUrl = 'data:image/jpeg;base64,' + buf.toString('base64');
    photoId = crypto.randomUUID();
    db.prepare('INSERT INTO survey_photos(id, roomId, createdAt, label, dataUrl) VALUES(?,?,?,?,?)')
      .run(photoId, id, now, photoLabel || 'Habitat Survey View', dataUrl);
    console.log(`Attached photo "${photoLabel}" to space: ${name}`);
  }

  // Clear previous findings & assessments for this space
  db.prepare('DELETE FROM findings WHERE roomId = ?').run(id);
  db.prepare('DELETE FROM assessments WHERE roomId = ?').run(id);

  // Evaluate with NASA safety audit engine
  const { auditReport, findingsWithNasa } = auditFindingsWithNasa(findingsData, { name, kind, notes, adjacent });

  const assessmentId = crypto.randomUUID();
  const assessmentResult = {
    summary: summaryText,
    limitations: limitations || [
      'Visual survey cannot evaluate wiring inside sealed avionics chassis without sensor telemetry.',
      'Atmospheric composition (oxygen % and pressure) requires confirmation from ECLSS life support sensors.'
    ],
    follow_up_views: followUpViews || [
      'Overhead ventilation return ducting',
      'Behind avionics rack cable harnesses'
    ],
    findings: findingsData.map((f, i) => ({
      category: f.category,
      priority: f.priority,
      photo_index: 0,
      title: f.title,
      evidence: f.evidence,
      location: f.location || 'Cabin view',
      uncertainty: f.uncertainty || 'Visible assessment based on photographic survey.',
      suggested_action: f.action
    })),
    nasaAudit: auditReport
  };

  db.prepare('INSERT INTO assessments(id, roomId, createdAt, provider, model, result) VALUES(?,?,?,?,?,?)')
    .run(assessmentId, id, now, 'gemini', 'gemini-3.5-flash', JSON.stringify(assessmentResult));

  // Insert enriched findings
  for (const f of findingsWithNasa) {
    const findingId = crypto.randomUUID();
    const payload = {
      category: f.category,
      priority: f.priority,
      title: f.title,
      evidence: f.evidence,
      location: f.location || 'Cabin view',
      uncertainty: f.uncertainty || 'Visual observation requires astronaut inspection.',
      action: f.action,
      photoId,
      source: 'ai',
      assessmentId,
      status: 'unreviewed',
      reviewNote: '',
      nasaBenchmark: f.nasaBenchmark
    };
    db.prepare('INSERT INTO findings(id, roomId, createdAt, payload) VALUES(?,?,?,?)')
      .run(findingId, id, now, JSON.stringify(payload));
  }

  console.log(`Seeded space: ${name} (${findingsWithNasa.length} findings, NASA Status: ${auditReport.overallStatus})`);
}

// 1. Artemis Pressurized Exploration Rover
upsertSpace({
  id: 'space-rover-artemis-001',
  building: 'Artemis Surface Fleet',
  kind: 'other',
  name: 'Artemis Pressurized Exploration Rover',
  floor: 'Mobile Rover Cabin',
  notes: 'Pressurized habitable rover cabin (8.2 psia, 34% O₂). Cockpit navigation displays, astronaut jump seats, suitport recharge umbilicals, rear emergency airlock hatch.',
  adjacent: 'Suitport & Rear Airlock',
  photoPath: path.join(photosDir, 'artemis_rover_cabin.jpg'),
  photoLabel: 'Artemis Rover Cockpit & Egress Hatch',
  summaryText: 'Multi-hazard visual survey of Artemis Pressurized Rover crew volume. High-risk exit obstruction detected at rear airlock egress hatch, accompanied by unanchored lithium-ion tool batteries on the forward instrument console.',
  limitations: [
    'Sub-floor wiring to drive motors and exterior suitports cannot be verified from optical cabin photos.',
    'Cabin hyper-oxygenated atmosphere (34% O₂) drastically increases flammability of any loose polymers.'
  ],
  followUpViews: [
    'Exterior suitport seal interface',
    'Under-seat lithium battery stowage compartment'
  ],
  findingsData: [
    {
      category: 'blocked_exit',
      priority: 'urgent_review',
      title: 'Stowage duffel bag obstructing rear emergency egress hatch',
      evidence: 'A heavy polymer-coated EVA equipment duffel bag is wedged against the rear airlock hatch door and manual dogging wheel, restricting rapid crew evacuation.',
      location: 'Rear bulkhead, against emergency egress hatch frame',
      action: 'Immediately stow the equipment duffel in an overhead retention locker and verify a 1.2m clear corridor to the egress hatch per ISS SSP 50005 standard.',
      uncertainty: 'Whether the hatch latch mechanism can still operate without moving the duffel cannot be determined from a single view.'
    },
    {
      category: 'battery_charging',
      priority: 'urgent_review',
      title: 'Lithium-ion tool battery packs charging on cockpit console without thermal isolation',
      evidence: 'Multiple lithium-ion battery blocks and loose charging leads are resting on the composite dashboard adjacent to primary navigation telemetry displays.',
      location: 'Forward console, below auxiliary navigation screen',
      action: 'Move battery charging packs into flame-resistant charging bags or dedicated thermal containment bays equipped with fine water mist suppression per NASA JSC 20793.',
      uncertainty: 'State of charge and cell internal temperatures cannot be verified without battery management telemetry.'
    }
  ]
});

// 2. ISS US Destiny Science Laboratory
upsertSpace({
  id: 'space-iss-destiny-002',
  building: 'International Space Station (ISS)',
  kind: 'other',
  name: 'ISS US Destiny Science Laboratory Module',
  floor: 'Node 2 Forward / Lab Module',
  notes: 'Zero-gravity science laboratory (14.7 psia, 21% O₂, 10⁻⁵ g). Houses the Combustion Integrated Rack (CIR), EXPRESS payload racks, and life-support ducting.',
  adjacent: 'Harmony Node 2 Forward',
  photoPath: path.join(photosDir, 'iss_destiny_science_module.jpg'),
  photoLabel: 'Destiny Science Laboratory CIR Rack & Ventilation Port',
  summaryText: 'Visual screening of ISS Destiny science module identified cable clutter and fabric cargo bags draped near the floor environmental suction grille, creating microgravity thermal stagnation risks.',
  limitations: [
    'Internal experiment chamber seals inside the Combustion Integrated Rack cannot be inspected from cabin view.',
    'Aerosol sensor response times depend on forced cabin airflow loops.'
  ],
  followUpViews: [
    'CIR fuel manifold umbilical connection',
    'EXPRESS Rack #4 cable pass-through bundle'
  ],
  findingsData: [
    {
      category: 'combustibles_heat',
      priority: 'urgent_review',
      title: 'Cargo stowage pouch and wiring draped over primary ventilation suction grille',
      evidence: 'Loose diagnostic wiring harness and drifting cloth Cargo Transfer Bags (CTBs) are obstructing the floor life-support ventilation intake grille near CIR rack avionics.',
      location: 'Floor deck ventilation intake port, adjacent to CIR payload rack',
      action: 'Clear all fabric bags and tethered cables at least 0.5m away from the suction intake port to prevent zero-g heat stagnation and ensure aerosol transport to detectors.',
      uncertainty: 'Air volumetric flow rate through the partially covered grille requires air flowmeter confirmation.'
    },
    {
      category: 'power_strip_chain',
      priority: 'review',
      title: 'Secondary multi-tap power breakout cord daisy-chained along handrail',
      evidence: 'An auxiliary multi-outlet power breakout harness is strapped to the handrail with multiple laptop transformers chained together.',
      location: 'Port-side science rack handrail, station forward',
      action: 'Plug high-draw payload transformers directly into certified avionics power distribution outlets and avoid secondary multi-tap daisy chaining per NASA SP-5080.',
      uncertainty: 'Total cumulative electrical wattage drawn by the connected laptop bricks is unmeasured.'
    }
  ]
});

// 3. Lunar Base Habitat & ECLSS Life Support Bay
upsertSpace({
  id: 'space-lunar-base-003',
  building: 'Artemis Base Camp (Moon)',
  kind: 'other',
  name: 'Lunar Base Habitat & ECLSS Life Support Bay',
  floor: 'Habitat Deck 1 / ECLSS Bay',
  notes: 'Lunar surface habitat module (8.2 psia, 34% O₂, 0.166 g). Astronaut sleep pod berths, environmental control and life support system (ECLSS) air ducting, tool recharge bench.',
  adjacent: 'Multi-Mission Surface Airlock',
  photoPath: path.join(photosDir, 'lunar_base_habitat.jpg'),
  photoLabel: 'Lunar Hab Crew Quarters & ECLSS Ducting',
  summaryText: 'Habitability and fire hazard survey of Artemis Lunar Base module. Detected combustible polymer repair supplies in close proximity to the uninsulated environmental heater line.',
  limitations: [
    'Surface lunar regolith dust infiltration effects on electrical contacts require secondary particle diagnostics.',
    'Hyper-oxygenated 34% O₂ environment drastically lowers material ignition thresholds.'
  ],
  followUpViews: [
    'Airlock pressure bulkhead seals',
    'Under-floor ECLSS oxygen concentration manifold'
  ],
  findingsData: [
    {
      category: 'combustibles_heat',
      priority: 'urgent_review',
      title: 'Polymer maintenance pack in direct contact with ECLSS heating line',
      evidence: 'A survival maintenance kit wrapped in synthetic polymer fabric is resting within 15cm of the uninsulated environmental control life-support heating duct.',
      location: 'Starboard bulkhead, beside main ECLSS heater line',
      action: 'Maintain at least 1-metre perimeter clearance between heating lines and polymer items, and protect with PBI/Nomex flame-resistant textile barriers per NASA-STD-6001.',
      uncertainty: 'External surface temperature of the ECLSS duct cannot be measured from photo evidence alone.'
    },
    {
      category: 'power_strip_chain',
      priority: 'review',
      title: 'High-draw power cables crossing main sleep pod transit corridor',
      evidence: 'Unsecured heavy-gauge power cables from the tool recharge bench are trailing across the main deck floor between sleep pods without cable ramps.',
      location: 'Central deck corridor between sleep pod #2 and workbench',
      action: 'Route and clamp all electrical cables into overhead raceways to avoid physical abrasion, tripping, and insulation wear in confined lunar crew spaces.',
      uncertainty: 'Visible outer jacket shows minor scuffing, but conductor integrity requires multimeter inspection.'
    }
  ]
});

// 4. Combustion Test Chamber (NASA Glenn GRC Facility) - update to NASA complex
const testChamber = db.prepare("SELECT id FROM safety_rooms WHERE payload LIKE '%Combustion Test Chamber%' LIMIT 1").get();
if (testChamber) {
  const grcPayload = {
    building: 'NASA Glenn Research Center',
    kind: 'other',
    name: 'Combustion Integrated Rack Ground Chamber',
    floor: 'Building 5 / Combustion Test Facility',
    notes: 'Ground 1g verification test cell for microgravity combustion science experiments. High-pressure optical chamber, laser diagnostics, gaseous fuel manifolds.',
    adjacent: 'Diagnostic Laser Lab & Data Acquisition'
  };
  db.prepare('UPDATE safety_rooms SET payload = ? WHERE id = ?').run(JSON.stringify(grcPayload), testChamber.id);
  console.log('Updated Combustion Test Chamber to NASA GRC research facility.');
}

console.log('Space habitats seeding successfully completed!');
