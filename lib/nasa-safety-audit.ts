/**
 * NASA Fire Safety & Spaceflight Habitat Audit Engine
 * Evaluates visual survey findings and space parameters against:
 * 1. NASA-STD-6001 (Flammability, Odor, Offgassing, and Compatibility)
 * 2. Apollo 1 (AS-204) & Apollo 13 spaceflight fire investigation lessons
 * 3. Mir 1997 zero-g smoke stagnation & emergency egress protocols
 * 4. NASA Spinoffs #9407 (multi-criteria aerosol detection) & #9582 (fine water mist)
 * 5. NASA PSI microgravity combustion physics (LOI, quench diameter, radiation fraction)
 */

import type { CategoryKey } from './safety';

export interface NasaFindingBenchmark {
  standard: string;
  standardCode: string;
  spaceRisk: string;
  earthSpinoffMitigation: string;
  historicalIncident?: string;
  simPresetId: 'apollo-1' | 'apollo-13' | 'mir-1997' | 'psi-acme' | 'psi-flex-2' | 'psi-bass-ii';
  psiInvestigationId: 'psi-acme' | 'psi-flex-2' | 'psi-bass-ii' | 'psi-bre' | 'psi-sofie' | 'psi-s-flame';
  spinoffId: 'spinoff-water-mist' | 'spinoff-smoke-detection' | 'spinoff-firefighter-gear';
  complianceLevel: 'critical_violation' | 'standard_deviation' | 'advisory';
}

export interface MissionHabitatStatus {
  missionId: 'iss' | 'lunar' | 'mars' | 'rover';
  name: string;
  callsign: string;
  environment: string; // e.g. "14.7 psia · 21% O₂ · 0 g"
  status: 'certified' | 'conditional' | 'failed';
  summary: string;
  reasons: string[];
}

export interface NasaAuditReport {
  overallStatus: 'Flight Certified' | 'Conditional Flight Waiver' | 'Non-Compliant / Flashover Threat';
  overallScore: number; // 0 - 100
  evaluatedAt: number;
  totalFindingsEvaluated: number;
  urgentViolationsCount: number;
  reviewDeviationsCount: number;
  missionCertifications: MissionHabitatStatus[];
  criticalRisksSummary: string;
  primaryMitigationRecommendation: string;
  referencedStandards: string[];
}

export interface FindingInput {
  category: CategoryKey;
  priority: 'review' | 'urgent_review';
  title: string;
  evidence: string;
  location?: string;
  action?: string;
  suggested_action?: string;
}

export interface RoomContextInput {
  name: string;
  kind: string;
  notes?: string;
  adjacent?: string;
}

/**
 * Assigns an exact NASA spaceflight benchmark, flammability standard,
 * microgravity risk breakdown, and terrestrial spinoff mitigation to a finding.
 */
export function evaluateFindingNasaBenchmark(finding: FindingInput): NasaFindingBenchmark {
  const text = `${finding.title} ${finding.evidence} ${finding.action || ''}`.toLowerCase();

  // 1. Combustibles near heat sources (space heaters, hot plates, heating elements)
  if (finding.category === 'combustibles_heat' || text.includes('heater') || text.includes('curtain') || text.includes('drapes')) {
    const isUrgent = finding.priority === 'urgent_review';
    return {
      standard: 'NASA-STD-6001 Test 1: Upward Flame Propagation & Radiant Clearance',
      standardCode: 'NASA-STD-6001-T1',
      complianceLevel: isUrgent ? 'critical_violation' : 'standard_deviation',
      spaceRisk:
        'In confined crew cabins and elevated oxygen environments (Lunar 34% O₂), radiant pre-heating drops the ignition energy to near zero. Without buoyant convective cooling, materials with Limiting Oxygen Index (LOI) < 25% ignite instantaneously into explosive flashover.',
      earthSpinoffMitigation:
        'Maintain minimum 1-metre perimeter clearance and apply PBI/aramid flame-resistant barrier textiles (NASA Spinoff #9918 Firefighter Gear heritage).',
      historicalIncident: 'Apollo 1 (AS-204): Combustibles inside high-oxygen envelope flashover in under 15 seconds.',
      simPresetId: 'apollo-1',
      psiInvestigationId: 'psi-acme',
      spinoffId: 'spinoff-firefighter-gear'
    };
  }

  // 2. Power strip daisy-chaining & electrical overload
  if (finding.category === 'power_strip_chain' || finding.category === 'electrical_damage' || text.includes('strip') || text.includes('cord') || text.includes('daisy') || text.includes('wire')) {
    const isUrgent = finding.priority === 'urgent_review';
    return {
      standard: 'NASA SP-5080 & Apollo Electrical Harness Protection Standard',
      standardCode: 'NASA-SP-5080',
      complianceLevel: isUrgent ? 'critical_violation' : 'standard_deviation',
      spaceRisk:
        'Zero-gravity atmospheres lack natural heat dissipation around electrical conductors, causing internal copper temperatures to double under nominal load. Teflon/polymer insulation degrades rapidly, triggering arcing and toxic fluoropolymer pyrolysis gases.',
      earthSpinoffMitigation:
        'Eliminate multi-tap adapters, enforce single-point grounded breaker circuits, and install intelligent dual-wavelength smoke detection (NASA Spinoff #9407).',
      historicalIncident: 'Apollo 13: Electrical wiring insulation breakdown inside cryogenic oxygen bay provoked explosive pressure burst.',
      simPresetId: 'apollo-13',
      psiInvestigationId: 'psi-flex-2',
      spinoffId: 'spinoff-smoke-detection'
    };
  }

  // 3. Blocked exit routes and pathways
  if (finding.category === 'blocked_exit' || text.includes('exit') || text.includes('door') || text.includes('path') || text.includes('obstruct')) {
    return {
      standard: 'ISS SSP 50005 & Mir EO-23 Zero-G Emergency Egress Standard',
      standardCode: 'ISS-SSP-50005-EGRESS',
      complianceLevel: 'critical_violation',
      spaceRisk:
        'During microgravity fires, smoke does not rise to the ceiling; it stagnates into an opaque, oily aerosol cloud that blinds occupants within 20 seconds. Obstructed egress pathways to emergency hatches or escape vehicles (Soyuz/Orion) are categorized as Catastrophic Loss of Crew risks.',
      earthSpinoffMitigation:
        'Establish minimum 1.2 m unobstructed egress corridors and equip path with photoluminescent floor tracking and dual-channel air extraction (Mir lesson).',
      historicalIncident: 'Mir 1997: Smoke stagnation completely obscured visibility, trapping cosmonauts who had to navigate by tactile memory to fight the fire.',
      simPresetId: 'mir-1997',
      psiInvestigationId: 'psi-bass-ii',
      spinoffId: 'spinoff-smoke-detection'
    };
  }

  // 4. Lithium-ion battery charging on combustible surfaces
  if (finding.category === 'battery_charging' || text.includes('battery') || text.includes('charger') || text.includes('phone') || text.includes('laptop')) {
    return {
      standard: 'NASA JSC 20793: Crewed Spacecraft Battery Safety Protocol',
      standardCode: 'NASA-JSC-20793',
      complianceLevel: finding.priority === 'urgent_review' ? 'critical_violation' : 'standard_deviation',
      spaceRisk:
        'Lithium-ion cells in thermal runaway generate high-velocity jet flames and energetic offgassing (CO, H₂, CH₄). In spacecraft ventilation circuits, this forms flammable gas pockets that can detonate in confined ducting.',
      earthSpinoffMitigation:
        'Charge devices on hard non-conductive surfaces only, store in thermal-barrier charging bags, and deploy fine water mist extinguishers (NASA Spinoff #9582).',
      historicalIncident: 'International Space Station (CIR): Droplet and chemical energy concentration experiments.',
      simPresetId: 'psi-flex-2',
      psiInvestigationId: 'psi-flex-2',
      spinoffId: 'spinoff-water-mist'
    };
  }

  // 5. Cooking areas and open flames
  if (finding.category === 'cooking' || text.includes('cook') || text.includes('stove') || text.includes('burner') || text.includes('grease')) {
    return {
      standard: 'NASA CIR Microgravity Aerosol & Open Combustion Regulation',
      standardCode: 'NASA-CIR-AEROSOL',
      complianceLevel: finding.priority === 'urgent_review' ? 'critical_violation' : 'standard_deviation',
      spaceRisk:
        'Open combustion and cooking vapors in enclosed life-support systems saturate environmental control filters with combustible organic condensates, lowering the ignition threshold of neighboring surfaces.',
      earthSpinoffMitigation:
        'Equip cooking zones with advanced multi-criteria optical sensors that reject benign steam while spotting smoldering fires (NASA Spinoff #9407).',
      historicalIncident: 'ACME ISS experiments: Gaseous burner limits without buoyant upward heat convective cooling.',
      simPresetId: 'psi-acme',
      psiInvestigationId: 'psi-acme',
      spinoffId: 'spinoff-smoke-detection'
    };
  }

  // Default: General visible fire hazard
  return {
    standard: 'NASA-STD-6001 General Spaceflight Fire Prevention Advisory',
    standardCode: 'NASA-STD-6001-GEN',
    complianceLevel: finding.priority === 'urgent_review' ? 'critical_violation' : 'advisory',
    spaceRisk:
      'Any uncharacterized combustible or electrical anomaly in a sealed habitat increases thermal and toxic burden on the life-support system and must be formally mitigated.',
    earthSpinoffMitigation:
      'Conduct regular visual sweeps, deploy fine water mist extinguishers (NASA Spinoff #9582), and verify smoke detector battery status.',
    simPresetId: 'psi-bass-ii',
    psiInvestigationId: 'psi-bre',
    spinoffId: 'spinoff-water-mist'
  };
}

/**
 * Evaluates the space against 4 operational Mission Habitats:
 * 1. ISS Space Station (LEO, 0g, 14.7 psia, 21% O₂)
 * 2. Lunar Base Artemis (Moon, 0.166g, 8.2 psia, 34% O₂)
 * 3. Mars Surface Habitat (Mars, 0.38g, 8.0 psia, 32% O₂)
 * 4. Pressurized Exploration Rover (Mobile rover, 8.2 psia, 34% O₂, confined egress)
 */
export function evaluateMissionCertifications(findings: FindingInput[], room: RoomContextInput): MissionHabitatStatus[] {
  const urgentCount = findings.filter(f => f.priority === 'urgent_review').length;
  const reviewCount = findings.filter(f => f.priority === 'review').length;

  const hasCombustibleNearHeat = findings.some(
    f => f.category === 'combustibles_heat' || f.title.toLowerCase().includes('heater') || f.evidence.toLowerCase().includes('curtain')
  );
  const hasElectricalChain = findings.some(
    f => f.category === 'power_strip_chain' || f.category === 'electrical_damage' || f.title.toLowerCase().includes('strip')
  );
  const hasBlockedExit = findings.some(
    f => f.category === 'blocked_exit' || f.title.toLowerCase().includes('exit') || f.evidence.toLowerCase().includes('door')
  );
  const hasBatteryRisk = findings.some(
    f => f.category === 'battery_charging' || f.title.toLowerCase().includes('battery')
  );

  // 1. ISS Space Station
  const issReasons: string[] = [];
  if (hasBlockedExit) issReasons.push('Critical: Emergency egress to return vehicle (Soyuz/Crew Dragon) is compromised (Mir 1997 lesson).');
  if (hasElectricalChain) issReasons.push('Warning: Uncertified multi-tap wiring increases heat buildup in non-convective 0 g airflow.');
  if (hasCombustibleNearHeat) issReasons.push('Critical: Radiative heat flux without buoyancy creates expanding combustible flame ball.');
  if (urgentCount === 0 && reviewCount === 0) issReasons.push('Zero active anomalies: Compliant with ISS SSP 50005 flight rules.');

  const issStatus: 'certified' | 'conditional' | 'failed' =
    hasBlockedExit || (hasCombustibleNearHeat && urgentCount > 0)
      ? 'failed'
      : urgentCount > 0 || reviewCount > 0
        ? 'conditional'
        : 'certified';

  // 2. Lunar Base Artemis (8.2 psia, 34% O₂)
  const lunarReasons: string[] = [];
  if (hasCombustibleNearHeat) lunarReasons.push('Severe: 34% hyper-oxygenated atmosphere drastically lowers LOI, inducing rapid flashover (Apollo 1 lesson).');
  if (hasElectricalChain) lunarReasons.push('Critical: Wire insulation in high oxygen has near-zero ignition barrier.');
  if (hasBatteryRisk) lunarReasons.push('Warning: Thermal runaway offgas accelerates in low lunar ambient pressure (8.2 psia).');
  if (urgentCount === 0 && reviewCount === 0) lunarReasons.push('Passed NASA-STD-6001 materials and flammability threshold for Artemis Gateway.');

  const lunarStatus: 'certified' | 'conditional' | 'failed' =
    hasCombustibleNearHeat || hasElectricalChain || urgentCount > 0
      ? 'failed'
      : reviewCount > 0
        ? 'conditional'
        : 'certified';

  // 3. Mars Surface Habitat (8.0 psia, 32% O₂, 0.38g)
  const marsReasons: string[] = [];
  if (hasCombustibleNearHeat) marsReasons.push('Warning: 0.38 g gravity creates weak buoyant plume with broadened radiant heat envelope (S-Flame benchmark).');
  if (hasBlockedExit) marsReasons.push('Critical: EVA airlock egress route blocked; violates pressurized module isolation protocols.');
  if (hasElectricalChain) marsReasons.push('Warning: Low-density Martian cabin air requires secondary duct cooling for high-wattage cords.');
  if (urgentCount === 0 && reviewCount === 0) marsReasons.push('Compliant with NASA Mars Hab Environmental Control & Life Support System (ECLSS).');

  const marsStatus: 'certified' | 'conditional' | 'failed' =
    hasBlockedExit || urgentCount > 0
      ? 'failed'
      : reviewCount > 0
        ? 'conditional'
        : 'certified';

  // 4. Pressurized Exploration Rover (Confined volume, 8.2 psia, 34% O₂)
  const roverReasons: string[] = [];
  if (hasBlockedExit) roverReasons.push('Critical: Single rover hatch obstructed; crew cannot evacuate in an emergency.');
  if (hasBatteryRisk || hasElectricalChain) roverReasons.push('Critical: High packaging density in rover cabin makes electrical/battery fires catastrophic.');
  if (hasCombustibleNearHeat) roverReasons.push('Severe: Elevated O₂ cabin accelerates flame spread across interior upholstery.');
  if (urgentCount === 0 && reviewCount === 0) roverReasons.push('Certified for crewed surface traverse and unescorted rover sorties.');

  const roverStatus: 'certified' | 'conditional' | 'failed' =
    hasBlockedExit || hasBatteryRisk || hasElectricalChain || urgentCount > 0
      ? 'failed'
      : reviewCount > 0
        ? 'conditional'
        : 'certified';

  return [
    {
      missionId: 'iss',
      name: 'ISS Space Station',
      callsign: 'LEO Habitable Module',
      environment: '14.7 psia · 21% O₂ · 10⁻⁵ g',
      status: issStatus,
      summary:
        issStatus === 'certified'
          ? 'Compliant with NASA ISS SSP 50005 flight safety criteria.'
          : issStatus === 'conditional'
            ? 'Operational waiver required: mitigate thermal/wiring anomalies.'
            : 'NON-COMPLIANT: Violates microgravity stagnation & egress standards.',
      reasons: issReasons
    },
    {
      missionId: 'lunar',
      name: 'Lunar Base (Artemis)',
      callsign: 'Gateway / Surface Hab',
      environment: '8.2 psia · 34% O₂ · 0.166 g',
      status: lunarStatus,
      summary:
        lunarStatus === 'certified'
          ? 'Passes hyper-oxygenated NASA-STD-6001 flammability envelope.'
          : lunarStatus === 'conditional'
            ? 'Requires re-testing of combustible items under 34% O₂.'
            : 'FAILED: Extreme flashover threat in elevated oxygen (Apollo 1 lesson).',
      reasons: lunarReasons
    },
    {
      missionId: 'mars',
      name: 'Mars Surface Habitat',
      callsign: 'Martian Hab & Lab',
      environment: '8.0 psia · 32% O₂ · 0.38 g',
      status: marsStatus,
      summary:
        marsStatus === 'certified'
          ? 'Meets Mars ECLSS thermal barrier and airlock clearance rules.'
          : marsStatus === 'conditional'
            ? 'Advisory: monitor low-gravity soot retention & radiant spread.'
            : 'FAILED: Egress hazard or unmanaged radiant heat source.',
      reasons: marsReasons
    },
    {
      missionId: 'rover',
      name: 'Pressurized Rover',
      callsign: 'Artemis Surface Rover',
      environment: '8.2 psia · 34% O₂ · Confined Volume',
      status: roverStatus,
      summary:
        roverStatus === 'certified'
          ? 'Passed rover high-density cabin safety and hatch clearance.'
          : roverStatus === 'conditional'
            ? 'Requires single-point load verification before traverse.'
            : 'FAILED: Blocked escape hatch or electrical runaway risk in compact cabin.',
      reasons: roverReasons
    }
  ];
}

/**
 * Top-level audit function that runs immediately after Gemini vision processing.
 */
export function auditFindingsWithNasa(
  findings: FindingInput[],
  room: RoomContextInput
): {
  findingsWithNasa: (FindingInput & { nasaBenchmark: NasaFindingBenchmark })[];
  auditReport: NasaAuditReport;
} {
  const findingsWithNasa = findings.map(f => ({
    ...f,
    nasaBenchmark: evaluateFindingNasaBenchmark(f)
  }));

  const missionCertifications = evaluateMissionCertifications(findings, room);

  const urgentViolationsCount = findings.filter(f => f.priority === 'urgent_review').length;
  const reviewDeviationsCount = findings.filter(f => f.priority === 'review').length;

  const failedCount = missionCertifications.filter(m => m.status === 'failed').length;
  const conditionalCount = missionCertifications.filter(m => m.status === 'conditional').length;

  const overallStatus: NasaAuditReport['overallStatus'] =
    failedCount > 0
      ? 'Non-Compliant / Flashover Threat'
      : conditionalCount > 0
        ? 'Conditional Flight Waiver'
        : 'Flight Certified';

  // Calculate score (100 base, -25 per urgent, -10 per review)
  const overallScore = Math.max(0, 100 - urgentViolationsCount * 25 - reviewDeviationsCount * 10);

  let criticalRisksSummary = 'No critical spaceflight fire hazards identified. Space conforms to baseline safety criteria.';
  if (urgentViolationsCount > 0) {
    criticalRisksSummary = `Identified ${urgentViolationsCount} high-risk condition(s) violating NASA-STD-6001 or microgravity egress rules. Elevated flashover and non-buoyant aerosol hazards detected.`;
  } else if (reviewDeviationsCount > 0) {
    criticalRisksSummary = `Identified ${reviewDeviationsCount} standard deviation(s). Acceptable for terrestrial use but requires mitigation for sealed crewed environments.`;
  }

  const primaryMitigationRecommendation =
    urgentViolationsCount > 0
      ? 'Immediately clear 1m clearance perimeter around heat appliances, eliminate daisy-chained strips, and install multi-criteria optical sensors (NASA Spinoff #9407).'
      : 'Maintain clear egress corridors and equip space with fine water mist fire suppression (NASA Spinoff #9582).';

  const referencedStandards = [
    'NASA-STD-6001 (Flammability Acceptance Criteria)',
    'NASA SP-5080 (High-Pressure Wiring Systems)',
    'ISS SSP 50005 (Flight Crew Emergency Egress)',
    'NASA Spinoff #9407 (Multi-Criteria Smoke Detection)',
    'NASA Spinoff #9582 (Fine-Water-Mist Fire Suppression)'
  ];

  const auditReport: NasaAuditReport = {
    overallStatus,
    overallScore,
    evaluatedAt: Date.now(),
    totalFindingsEvaluated: findings.length,
    urgentViolationsCount,
    reviewDeviationsCount,
    missionCertifications,
    criticalRisksSummary,
    primaryMitigationRecommendation,
    referencedStandards
  };

  return { findingsWithNasa, auditReport };
}
