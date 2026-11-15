import type { SafetyState, Room, Finding, Assessment, Photo } from './safety.ts';
import { auditFindingsWithNasa } from './nasa-safety-audit.ts';

const NOW = 1794680000000;

// Space 1: Artemis Rover
const roverRoom: Room = {
  id: 'space-rover-artemis-001',
  building: 'Artemis Surface Fleet',
  kind: 'other',
  name: 'Artemis Pressurized Exploration Rover',
  floor: 'Mobile Rover Cabin',
  notes: 'Pressurized habitable rover cabin (8.2 psia, 34% O₂). Cockpit navigation displays, astronaut jump seats, suitport recharge umbilicals, rear emergency airlock hatch.',
  adjacent: 'Suitport & Rear Airlock',
  createdAt: NOW - 3600000 * 24
};

const roverFindingsRaw = [
  {
    category: 'blocked_exit' as const,
    priority: 'urgent_review' as const,
    title: 'Stowage duffel bag obstructing rear emergency egress hatch',
    evidence: 'A heavy polymer-coated EVA equipment duffel bag is wedged against the rear airlock hatch door and manual dogging wheel, restricting rapid crew evacuation.',
    location: 'Rear bulkhead, against emergency egress hatch frame',
    action: 'Immediately stow the equipment duffel in an overhead retention locker and verify a 1.2m clear corridor to the egress hatch per ISS SSP 50005 standard.',
    uncertainty: 'Whether the hatch latch mechanism can still operate without moving the duffel cannot be determined from a single view.'
  },
  {
    category: 'battery_charging' as const,
    priority: 'urgent_review' as const,
    title: 'Lithium-ion tool battery packs charging on cockpit console without thermal isolation',
    evidence: 'Multiple lithium-ion battery blocks and loose charging leads are resting on the composite dashboard adjacent to primary navigation telemetry displays.',
    location: 'Forward console, below auxiliary navigation screen',
    action: 'Move battery charging packs into flame-resistant charging bags or dedicated thermal containment bays equipped with fine water mist suppression per NASA JSC 20793.',
    uncertainty: 'State of charge and cell internal temperatures cannot be verified without battery management telemetry.'
  }
];

const roverAudit = auditFindingsWithNasa(roverFindingsRaw, {
  name: roverRoom.name,
  kind: roverRoom.kind,
  notes: roverRoom.notes,
  adjacent: roverRoom.adjacent
});

const roverFindings: Finding[] = roverAudit.findingsWithNasa.map((f, i) => {
  const orig = roverFindingsRaw[i];
  return {
    id: `finding-rover-00${i + 1}`,
    roomId: roverRoom.id,
    photoId: 'photo-rover-001',
    category: f.category,
    priority: f.priority,
    title: f.title,
    evidence: f.evidence,
    location: f.location || 'Rear Bulkhead',
    uncertainty: orig.uncertainty,
    action: orig.action,
    source: 'ai',
    assessmentId: 'assessment-rover-001',
    status: 'unreviewed',
    reviewNote: '',
    createdAt: NOW - 3600000 * 20,
    nasaBenchmark: f.nasaBenchmark
  };
});

const roverAssessment: Assessment = {
  id: 'assessment-rover-001',
  roomId: roverRoom.id,
  createdAt: NOW - 3600000 * 20,
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  result: {
    summary: 'Multi-hazard visual survey of Artemis Pressurized Rover crew volume. High-risk exit obstruction detected at rear airlock egress hatch, accompanied by unanchored lithium-ion tool batteries on the forward instrument console.',
    limitations: [
      'Sub-floor wiring to drive motors and exterior suitports cannot be verified from optical cabin photos.',
      'Cabin hyper-oxygenated atmosphere (34% O₂) drastically increases flammability of any loose polymers.'
    ],
    follow_up_views: [
      'Exterior suitport seal interface',
      'Under-seat lithium battery stowage compartment'
    ],
    findings: roverFindingsRaw.map((f, i) => ({
      category: f.category,
      priority: f.priority,
      photo_index: 0,
      title: f.title,
      evidence: f.evidence,
      location: f.location,
      uncertainty: f.uncertainty,
      suggested_action: f.action
    }))
  },
  nasaAudit: roverAudit.auditReport
};

// Space 2: ISS US Destiny Science Laboratory
const issRoom: Room = {
  id: 'space-iss-destiny-002',
  building: 'International Space Station (ISS)',
  kind: 'other',
  name: 'ISS US Destiny Science Laboratory Module',
  floor: 'Node 2 Forward / Lab Module',
  notes: 'Zero-gravity science laboratory (14.7 psia, 21% O₂, 10⁻⁵ g). Houses the Combustion Integrated Rack (CIR), EXPRESS payload racks, and life-support ducting.',
  adjacent: 'Harmony Node 2 Forward',
  createdAt: NOW - 3600000 * 48
};

const issFindingsRaw = [
  {
    category: 'combustibles_heat' as const,
    priority: 'urgent_review' as const,
    title: 'Cargo stowage pouch and wiring draped over primary ventilation suction grille',
    evidence: 'Loose diagnostic wiring harness and drifting cloth Cargo Transfer Bags (CTBs) are obstructing the floor life-support ventilation intake grille near CIR rack avionics.',
    location: 'Floor deck ventilation intake port, adjacent to CIR payload rack',
    action: 'Clear all fabric bags and tethered cables at least 0.5m away from the suction intake port to prevent zero-g heat stagnation and ensure aerosol transport to detectors.',
    uncertainty: 'Air volumetric flow rate through the partially covered grille requires air flowmeter confirmation.'
  },
  {
    category: 'power_strip_chain' as const,
    priority: 'review' as const,
    title: 'Secondary multi-tap power breakout cord daisy-chained along handrail',
    evidence: 'An auxiliary multi-outlet power breakout harness is strapped to the handrail with multiple laptop transformers chained together.',
    location: 'Port-side science rack handrail, station forward',
    action: 'Plug high-draw payload transformers directly into certified avionics power distribution outlets and avoid secondary multi-tap daisy chaining per NASA SP-5080.',
    uncertainty: 'Total cumulative electrical wattage drawn by the connected laptop bricks is unmeasured.'
  }
];

const issAudit = auditFindingsWithNasa(issFindingsRaw, {
  name: issRoom.name,
  kind: issRoom.kind,
  notes: issRoom.notes,
  adjacent: issRoom.adjacent
});

const issFindings: Finding[] = issAudit.findingsWithNasa.map((f, i) => {
  const orig = issFindingsRaw[i];
  return {
    id: `finding-iss-00${i + 1}`,
    roomId: issRoom.id,
    photoId: 'photo-iss-002',
    category: f.category,
    priority: f.priority,
    title: f.title,
    evidence: f.evidence,
    location: f.location || 'Science Deck',
    uncertainty: orig.uncertainty,
    action: orig.action,
    source: 'ai',
    assessmentId: 'assessment-iss-002',
    status: 'unreviewed',
    reviewNote: '',
    createdAt: NOW - 3600000 * 40,
    nasaBenchmark: f.nasaBenchmark
  };
});

const issAssessment: Assessment = {
  id: 'assessment-iss-002',
  roomId: issRoom.id,
  createdAt: NOW - 3600000 * 40,
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  result: {
    summary: 'Visual screening of ISS Destiny science module identified cable clutter and fabric cargo bags draped near the floor environmental suction grille, creating microgravity thermal stagnation risks.',
    limitations: [
      'Internal experiment chamber seals inside the Combustion Integrated Rack cannot be inspected from cabin view.',
      'Aerosol sensor response times depend on forced cabin airflow loops.'
    ],
    follow_up_views: [
      'CIR fuel manifold umbilical connection',
      'EXPRESS Rack #4 cable pass-through bundle'
    ],
    findings: issFindingsRaw.map((f, i) => ({
      category: f.category,
      priority: f.priority,
      photo_index: 0,
      title: f.title,
      evidence: f.evidence,
      location: f.location,
      uncertainty: f.uncertainty,
      suggested_action: f.action
    }))
  },
  nasaAudit: issAudit.auditReport
};

// Space 3: Lunar Base Habitat
const lunarRoom: Room = {
  id: 'space-lunar-base-003',
  building: 'Artemis Base Camp (Moon)',
  kind: 'other',
  name: 'Lunar Base Habitat & ECLSS Life Support Bay',
  floor: 'Habitat Deck 1 / ECLSS Bay',
  notes: 'Lunar surface habitat module (8.2 psia, 34% O₂, 0.166 g). Astronaut sleep pod berths, environmental control and life support system (ECLSS) air ducting, tool recharge bench.',
  adjacent: 'Multi-Mission Surface Airlock',
  createdAt: NOW - 3600000 * 72
};

const lunarFindingsRaw = [
  {
    category: 'combustibles_heat' as const,
    priority: 'urgent_review' as const,
    title: 'Polymer maintenance pack in direct contact with ECLSS heating line',
    evidence: 'A survival maintenance kit wrapped in synthetic polymer fabric is resting within 15cm of the uninsulated environmental control life-support heating duct.',
    location: 'Starboard bulkhead, beside main ECLSS heater line',
    action: 'Maintain at least 1-metre perimeter clearance between heating lines and polymer items, and protect with PBI/Nomex flame-resistant textile barriers per NASA-STD-6001.',
    uncertainty: 'External surface temperature of the ECLSS duct cannot be measured from photo evidence alone.'
  },
  {
    category: 'power_strip_chain' as const,
    priority: 'review' as const,
    title: 'High-draw power cables crossing main sleep pod transit corridor',
    evidence: 'Unsecured heavy-gauge power cables from the tool recharge bench are trailing across the main deck floor between sleep pods without cable ramps.',
    location: 'Central deck corridor between sleep pod #2 and workbench',
    action: 'Route and clamp all electrical cables into overhead raceways to avoid physical abrasion, tripping, and insulation wear in confined lunar crew spaces.',
    uncertainty: 'Visible outer jacket shows minor scuffing, but conductor integrity requires multimeter inspection.'
  }
];

const lunarAudit = auditFindingsWithNasa(lunarFindingsRaw, {
  name: lunarRoom.name,
  kind: lunarRoom.kind,
  notes: lunarRoom.notes,
  adjacent: lunarRoom.adjacent
});

const lunarFindings: Finding[] = lunarAudit.findingsWithNasa.map((f, i) => {
  const orig = lunarFindingsRaw[i];
  return {
    id: `finding-lunar-00${i + 1}`,
    roomId: lunarRoom.id,
    photoId: 'photo-lunar-003',
    category: f.category,
    priority: f.priority,
    title: f.title,
    evidence: f.evidence,
    location: f.location || 'Starboard Bulkhead',
    uncertainty: orig.uncertainty,
    action: orig.action,
    source: 'ai',
    assessmentId: 'assessment-lunar-003',
    status: 'unreviewed',
    reviewNote: '',
    createdAt: NOW - 3600000 * 60,
    nasaBenchmark: f.nasaBenchmark
  };
});

const lunarAssessment: Assessment = {
  id: 'assessment-lunar-003',
  roomId: lunarRoom.id,
  createdAt: NOW - 3600000 * 60,
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  result: {
    summary: 'Habitability and fire hazard survey of Artemis Lunar Base module. Detected combustible polymer repair supplies in close proximity to the uninsulated environmental heater line.',
    limitations: [
      'Surface lunar regolith dust infiltration effects on electrical contacts require secondary particle diagnostics.',
      'Hyper-oxygenated 34% O₂ environment drastically lowers material ignition thresholds.'
    ],
    follow_up_views: [
      'Airlock pressure bulkhead seals',
      'Under-floor ECLSS oxygen concentration manifold'
    ],
    findings: lunarFindingsRaw.map((f, i) => ({
      category: f.category,
      priority: f.priority,
      photo_index: 0,
      title: f.title,
      evidence: f.evidence,
      location: f.location,
      uncertainty: f.uncertainty,
      suggested_action: f.action
    }))
  },
  nasaAudit: lunarAudit.auditReport
};

export const DEFAULT_HABITATS_STATE: SafetyState = {
  rooms: [roverRoom, issRoom, lunarRoom],
  findings: [...roverFindings, ...issFindings, ...lunarFindings],
  assessments: [roverAssessment, issAssessment, lunarAssessment],
  photoCounts: {
    'space-rover-artemis-001': 1,
    'space-iss-destiny-002': 1,
    'space-lunar-base-003': 1
  },
  at: NOW
};

export const DEFAULT_HABITAT_PHOTOS: Record<string, Photo> = {
  'photo-rover-001': {
    id: 'photo-rover-001',
    roomId: 'space-rover-artemis-001',
    label: 'Artemis Rover Cockpit & Egress Hatch',
    createdAt: NOW - 3600000 * 24,
    dataUrl: '/space-photos/artemis_rover_cabin.jpg'
  },
  'photo-iss-002': {
    id: 'photo-iss-002',
    roomId: 'space-iss-destiny-002',
    label: 'Destiny Science Laboratory CIR Rack & Ventilation Port',
    createdAt: NOW - 3600000 * 48,
    dataUrl: '/space-photos/iss_destiny_science_module.jpg'
  },
  'photo-lunar-003': {
    id: 'photo-lunar-003',
    roomId: 'space-lunar-base-003',
    label: 'Lunar Hab Crew Quarters & ECLSS Ducting',
    createdAt: NOW - 3600000 * 72,
    dataUrl: '/space-photos/lunar_base_habitat.jpg'
  }
};
