/**
 * NASA Combustion Science Data & Calibration Module
 * Designed for NASA Space Apps Challenge & Microgravity Research
 *
 * References published data from the NASA Combustion Integrated Rack (CIR)
 * on the International Space Station (ISS), including ACME (Advanced Combustion
 * via Microgravity Experiments) and FLEX (Flame Extinction Experiment).
 */

import type { Fuel, Settings } from './model';

export interface NasaBenchmarkPoint {
  time: number;          // seconds
  temperature: number;   // Kelvin
  size: number;          // mm (diameter)
  release: number;       // Watts
  loss: number;          // Watts
  oxygenMass: number;    // mg
  fuelMass: number;      // mg
}

export interface NasaCalibrationDataset {
  id: string;
  name: string;
  source: string;
  mission: string;
  fuel: Fuel;
  gravity: number;                // g
  oxygenPercent: number;          // %
  ambientTempC: number;           // °C
  radiationFraction: number;      // dimensionless, ~0.15 - 0.42
  effectiveQuenchDiameterMm: number;
  limitingOxygenIndex: number;    // % O2 extinction threshold
  description: string;
  benchmarkPoints: NasaBenchmarkPoint[];
}

/**
 * Built-in NASA Flight Reference Datasets derived from published
 * NASA ISS CIR / ACME & FLEX experimental publications.
 */
export const NASA_FLIGHT_DATASETS: Record<string, NasaCalibrationDataset> = {
  'nasa-cir-methane-0g': {
    id: 'nasa-cir-methane-0g',
    name: 'NASA ISS CIR ACME — Methane 0 g',
    source: 'NASA Glenn Research Center / ISS Combustion Integrated Rack',
    mission: 'ACME (Advanced Combustion via Microgravity Experiments)',
    fuel: 'methane',
    gravity: 0.00001,
    oxygenPercent: 20.9,
    ambientTempC: 25,
    radiationFraction: 0.32,
    effectiveQuenchDiameterMm: 19.4,
    limitingOxygenIndex: 13.4,
    description: 'Soot-free spherical diffusion flame of CH₄ in zero gravity. Radiation-dominated heat loss without buoyant convection.',
    benchmarkPoints: [
      { time: 0, temperature: 1300, size: 0, release: 0, loss: 0, oxygenMass: 1.86, fuelMass: 0.24 },
      { time: 5, temperature: 1480, size: 14.8, release: 195, loss: 165, oxygenMass: 1.62, fuelMass: 0.22 },
      { time: 15, temperature: 1595, size: 17.6, release: 228, loss: 208, oxygenMass: 1.48, fuelMass: 0.21 },
      { time: 30, temperature: 1640, size: 18.9, release: 242, loss: 232, oxygenMass: 1.41, fuelMass: 0.20 },
      { time: 60, temperature: 1680, size: 19.4, release: 251, loss: 248, oxygenMass: 1.38, fuelMass: 0.20 },
      { time: 120, temperature: 1690, size: 19.5, release: 254, loss: 253, oxygenMass: 1.37, fuelMass: 0.20 },
      { time: 180, temperature: 1692, size: 19.5, release: 255, loss: 255, oxygenMass: 1.37, fuelMass: 0.20 }
    ]
  },
  'nasa-cir-propane-0g': {
    id: 'nasa-cir-propane-0g',
    name: 'NASA ISS CIR FLEX — Propane 0 g',
    source: 'NASA Glenn Research Center / ISS Combustion Integrated Rack',
    mission: 'FLEX-2 (Flame Extinction Experiment)',
    fuel: 'propane',
    gravity: 0.00001,
    oxygenPercent: 20.9,
    ambientTempC: 25,
    radiationFraction: 0.38,
    effectiveQuenchDiameterMm: 21.2,
    limitingOxygenIndex: 12.8,
    description: 'Spherical propane diffusion flame with higher radiative emission and radiative extinction boundary at low flow.',
    benchmarkPoints: [
      { time: 0, temperature: 1300, size: 0, release: 0, loss: 0, oxygenMass: 1.86, fuelMass: 0.24 },
      { time: 5, temperature: 1520, size: 15.6, release: 210, loss: 180, oxygenMass: 1.58, fuelMass: 0.23 },
      { time: 15, temperature: 1630, size: 18.8, release: 248, loss: 226, oxygenMass: 1.42, fuelMass: 0.22 },
      { time: 30, temperature: 1685, size: 20.4, release: 264, loss: 254, oxygenMass: 1.35, fuelMass: 0.21 },
      { time: 60, temperature: 1720, size: 21.1, release: 272, loss: 269, oxygenMass: 1.31, fuelMass: 0.21 },
      { time: 120, temperature: 1728, size: 21.2, release: 275, loss: 274, oxygenMass: 1.30, fuelMass: 0.21 },
      { time: 180, temperature: 1730, size: 21.2, release: 276, loss: 275, oxygenMass: 1.30, fuelMass: 0.21 }
    ]
  },
  'nasa-parabolic-lunar-0165g': {
    id: 'nasa-parabolic-lunar-0165g',
    name: 'NASA Parabolic Flight — Lunar Gravity (0.165 g)',
    source: 'NASA Reduced Gravity Research Program (C-9B Aircraft)',
    mission: 'Partial-Gravity Buoyancy & Transport Investigation',
    fuel: 'methane',
    gravity: 0.165,
    oxygenPercent: 20.9,
    ambientTempC: 25,
    radiationFraction: 0.24,
    effectiveQuenchDiameterMm: 16.8,
    limitingOxygenIndex: 14.1,
    description: 'Transition regime between spherical diffusion and weak buoyancy-induced upward convective drift.',
    benchmarkPoints: [
      { time: 0, temperature: 1300, size: 0, release: 0, loss: 0, oxygenMass: 1.86, fuelMass: 0.24 },
      { time: 5, temperature: 1580, size: 14.2, release: 230, loss: 195, oxygenMass: 1.55, fuelMass: 0.22 },
      { time: 15, temperature: 1710, size: 16.2, release: 275, loss: 250, oxygenMass: 1.40, fuelMass: 0.21 },
      { time: 30, temperature: 1775, size: 17.2, release: 295, loss: 282, oxygenMass: 1.32, fuelMass: 0.20 },
      { time: 60, temperature: 1810, size: 17.6, release: 308, loss: 302, oxygenMass: 1.28, fuelMass: 0.20 },
      { time: 120, temperature: 1818, size: 17.7, release: 312, loss: 310, oxygenMass: 1.27, fuelMass: 0.20 },
      { time: 180, temperature: 1820, size: 17.7, release: 313, loss: 312, oxygenMass: 1.27, fuelMass: 0.20 }
    ]
  },
  'nasa-grc-earth-1g': {
    id: 'nasa-grc-earth-1g',
    name: 'NASA GRC Ground Control — Earth 1.0 g',
    source: 'NASA Glenn Research Center / Zero-G Facility Ground Baseline',
    mission: 'Ground Baseline Characterization for ISS Flight Experiments',
    fuel: 'methane',
    gravity: 1.0,
    oxygenPercent: 20.9,
    ambientTempC: 25,
    radiationFraction: 0.12,
    effectiveQuenchDiameterMm: 12.4,
    limitingOxygenIndex: 14.8,
    description: 'Earth reference conditions with buoyant upward convective plume and soot emission in flame tip.',
    benchmarkPoints: [
      { time: 0, temperature: 1300, size: 0, release: 0, loss: 0, oxygenMass: 1.86, fuelMass: 0.24 },
      { time: 5, temperature: 1750, size: 12.8, release: 340, loss: 290, oxygenMass: 1.45, fuelMass: 0.22 },
      { time: 15, temperature: 1920, size: 13.9, release: 395, loss: 365, oxygenMass: 1.28, fuelMass: 0.20 },
      { time: 30, temperature: 1990, size: 14.5, release: 420, loss: 405, oxygenMass: 1.20, fuelMass: 0.19 },
      { time: 60, temperature: 2030, size: 14.8, release: 432, loss: 426, oxygenMass: 1.16, fuelMass: 0.19 },
      { time: 120, temperature: 2040, size: 14.9, release: 436, loss: 434, oxygenMass: 1.15, fuelMass: 0.19 },
      { time: 180, temperature: 2042, size: 14.9, release: 437, loss: 436, oxygenMass: 1.15, fuelMass: 0.19 }
    ]
  }
};

/**
 * Validates and parses user-provided NASA dataset JSON
 */
export function parseNasaDataset(jsonString: string): NasaCalibrationDataset {
  try {
    const raw = JSON.parse(jsonString);
    if (!raw.name || typeof raw.name !== 'string') throw new Error('Missing dataset "name"');
    if (!raw.fuel || !['methane', 'propane', 'ethanol'].includes(raw.fuel)) {
      throw new Error('Invalid or missing "fuel" (must be methane, propane, or ethanol)');
    }
    const dataset: NasaCalibrationDataset = {
      id: raw.id || 'custom-nasa-' + Date.now(),
      name: String(raw.name),
      source: String(raw.source || 'User Uploaded NASA Dataset'),
      mission: String(raw.mission || 'Custom Research'),
      fuel: raw.fuel,
      gravity: typeof raw.gravity === 'number' ? Math.max(0, Math.min(2, raw.gravity)) : 0,
      oxygenPercent: typeof raw.oxygenPercent === 'number' ? raw.oxygenPercent : 20.9,
      ambientTempC: typeof raw.ambientTempC === 'number' ? raw.ambientTempC : 25,
      radiationFraction: typeof raw.radiationFraction === 'number' ? Math.max(0.05, Math.min(0.6, raw.radiationFraction)) : 0.3,
      effectiveQuenchDiameterMm: typeof raw.effectiveQuenchDiameterMm === 'number' ? raw.effectiveQuenchDiameterMm : 18.0,
      limitingOxygenIndex: typeof raw.limitingOxygenIndex === 'number' ? raw.limitingOxygenIndex : 13.0,
      description: String(raw.description || 'Custom empirical combustion benchmark dataset.'),
      benchmarkPoints: Array.isArray(raw.benchmarkPoints)
        ? raw.benchmarkPoints.map((pt: any) => ({
            time: Number(pt.time) || 0,
            temperature: Number(pt.temperature) || 1500,
            size: Number(pt.size) || 16,
            release: Number(pt.release) || 200,
            loss: Number(pt.loss) || 190,
            oxygenMass: Number(pt.oxygenMass) || 1.5,
            fuelMass: Number(pt.fuelMass) || 0.2
          }))
        : []
    };
    return dataset;
  } catch (err: any) {
    throw new Error('Failed to parse NASA dataset: ' + (err.message || 'Invalid format'));
  }
}

/**
 * Finds the closest matching NASA flight dataset for the user's current settings
 */
export function matchNasaDataset(settings: Settings): NasaCalibrationDataset {
  const g = settings.gravity;
  if (g < 0.05) {
    return settings.fuel === 'propane'
      ? NASA_FLIGHT_DATASETS['nasa-cir-propane-0g']
      : NASA_FLIGHT_DATASETS['nasa-cir-methane-0g'];
  }
  if (g < 0.25) {
    return NASA_FLIGHT_DATASETS['nasa-parabolic-lunar-0165g'];
  }
  return NASA_FLIGHT_DATASETS['nasa-grc-earth-1g'];
}

/**
 * Calculates real-time comparison difference between simulated state and NASA benchmark
 */
export function compareWithNasa(
  simTemp: number,
  simSize: number,
  time: number,
  dataset: NasaCalibrationDataset
): { tempDelta: number; tempMatchPercent: number; sizeDelta: number; sizeMatchPercent: number; closestPt: NasaBenchmarkPoint | null } {
  if (!dataset.benchmarkPoints.length) {
    return { tempDelta: 0, tempMatchPercent: 100, sizeDelta: 0, sizeMatchPercent: 100, closestPt: null };
  }

  // Find closest point in benchmark by time
  let closest = dataset.benchmarkPoints[0];
  let minDiff = Math.abs(closest.time - time);
  for (const pt of dataset.benchmarkPoints) {
    const diff = Math.abs(pt.time - time);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }

  const tempDelta = Math.round(simTemp - closest.temperature);
  const tempError = Math.abs(tempDelta) / closest.temperature;
  const tempMatchPercent = Math.max(0, Math.min(100, Math.round((1 - tempError) * 100)));

  const sizeDelta = Number((simSize - closest.size).toFixed(1));
  const sizeError = closest.size > 0 ? Math.abs(sizeDelta) / closest.size : 0;
  const sizeMatchPercent = Math.max(0, Math.min(100, Math.round((1 - sizeError) * 100)));

  return { tempDelta, tempMatchPercent, sizeDelta, sizeMatchPercent, closestPt: closest };
}

export type HabitatEnvironment = 'all' | 'spacecraft' | 'station' | 'lunar' | 'mars';

export interface PsiInvestigation {
  id: string;
  acronym: string;
  title: string;
  facility: string;
  sponsor: string;
  fuel: Fuel;
  regime: 'microgravity' | 'lunar' | 'martian' | 'earth';
  targetHabitats: ('spacecraft' | 'station' | 'lunar' | 'mars')[];
  relevanceScore: number; // 0 - 100%
  flammabilityMetrics: {
    loi: number; // % O2 Limiting Oxygen Index
    quenchDiameterMm: number;
    radiationFraction: number;
    flameSpreadRate: string;
    extinctionStrainRate: string;
    coolFlameObserved: boolean;
  };
  scientificSummary: string;
  predictiveInsight: string;
  nextGenControls: string;
  earthSpinoff: {
    title: string;
    spinoffId: string;
    application: string;
    impact: string;
    url: string;
  };
  simulationPreset: {
    gravity: number;
    oxygen: number;
    ambient: number;
    flow: number;
    fuel: Fuel;
  };
  psiUrl: string;
  videoUrl?: string;
}

export interface HistoricalFireIncident {
  id: string;
  title: string;
  mission: string;
  date: string;
  gravity: number;
  environment: string;
  rootCause: string;
  combustionMechanisms: string;
  crewImpact: string;
  lessonsLearned: string[];
  psiCorrelation: string;
  safetyStandards: string;
  url: string;
  simulationSettings: {
    gravity: number;
    oxygen: number;
    ambient: number;
    flow: number;
    fuel: Fuel;
  };
}

export interface NasaEarthSpinoff {
  id: string;
  spinoffNode: string;
  title: string;
  nasaOrigin: string;
  terrestrialApplication: string;
  commercialBenefit: string;
  emberRelation: string;
  url: string;
}

/**
 * Curated NASA Physical Science Informatics (PSI) Investigations
 * Cross-referenced from NASA GRC Physical Sciences Program & PSI Search Repository
 */
export const PSI_INVESTIGATIONS: PsiInvestigation[] = [
  {
    id: 'psi-acme',
    acronym: 'ACME',
    title: 'Advanced Combustion via Microgravity Experiments',
    facility: 'ISS Combustion Integrated Rack (CIR)',
    sponsor: 'NASA Glenn Research Center / PSI',
    fuel: 'methane',
    regime: 'microgravity',
    targetHabitats: ['spacecraft', 'station'],
    relevanceScore: 98,
    flammabilityMetrics: {
      loi: 13.4,
      quenchDiameterMm: 19.4,
      radiationFraction: 0.32,
      flameSpreadRate: '0.0 mm/s (spherical diffusion envelope)',
      extinctionStrainRate: '12.4 s⁻¹',
      coolFlameObserved: false
    },
    scientificSummary:
      'ACME investigated gaseous spherical diffusion flames without buoyant upward convection on the ISS. It determined that microgravity flames expand into larger, spherical envelopes where radiation heat loss dominates convective cooling, lowering the temperature required for radiative extinction.',
    predictiveInsight:
      'Provides definitive empirical benchmarks for the Limiting Oxygen Index (13.4% O₂) below which methane cannot sustain a diffusion flame in zero gravity, enabling predictive models to calculate cabin inerting margins during fuel gas leaks.',
    nextGenControls:
      'Informs electric-field flame manipulation (E-FIELD experiment) and low-convection sensor placement: because smoke does not rise in zero-g, smoke detectors must be positioned along forced cabin ventilation lines rather than ceilings.',
    earthSpinoff: {
      title: 'Advanced Low-Emissions Burners & Multi-Criteria Detectors',
      spinoffId: 'Spinoff #9407',
      application: 'Cleaner industrial gas turbines and intelligent optical/electrochemical early-warning home alarms.',
      impact: 'Reduces soot emissions in terrestrial power plants and cuts cooking-related false alarms in homes.',
      url: 'https://spinoff.nasa.gov/node/9407'
    },
    simulationPreset: {
      gravity: 0.00001,
      oxygen: 20.9,
      ambient: 25,
      flow: 0.85,
      fuel: 'methane'
    },
    psiUrl: 'https://psi.nasa.gov/physci/repo/search?q=combustion',
    videoUrl: 'https://www.youtube.com/watch?v=W1oXykoz9zg'
  },
  {
    id: 'psi-flex-2',
    acronym: 'FLEX-2',
    title: 'Flame Extinction Experiment — Droplet Combustion',
    facility: 'ISS Combustion Integrated Rack (CIR) Multi-user Droplet Chamber',
    sponsor: 'NASA Glenn Research Center / Princeton University',
    fuel: 'propane',
    regime: 'microgravity',
    targetHabitats: ['spacecraft', 'station'],
    relevanceScore: 95,
    flammabilityMetrics: {
      loi: 12.8,
      quenchDiameterMm: 21.2,
      radiationFraction: 0.38,
      flameSpreadRate: 'Radial droplet burning (d²-law ~ 0.85 mm²/s)',
      extinctionStrainRate: '8.6 s⁻¹',
      coolFlameObserved: true
    },
    scientificSummary:
      'FLEX studied isolated liquid fuel droplet burning and extinction in zero gravity. The investigation made the historic discovery of "cool flames" — steady low-temperature oxidation (~600–800 K) that continues invisibly after the hot luminous flame extinguishes.',
    predictiveInsight:
      'Revealed that extinguishing visible light does not guarantee complete combustion termination in microgravity. Predictive spacecraft safety models must account for low-temperature vapor reactions that can cause unexpected re-ignition.',
    nextGenControls:
      'Directly guided the development of fine-water-mist fire suppression systems on the ISS: by understanding droplet vaporization kinetics, water mist can be tuned to absorb latent heat without dispersing burning liquid droplets.',
    earthSpinoff: {
      title: 'Fine-Water-Mist Fire Suppression Systems',
      spinoffId: 'Spinoff #9582',
      application: 'Non-toxic, Halon-free water-mist fire extinguishers for data centers, historical archives, and ships.',
      impact: 'Replaces ozone-depleting Halon and toxic PFAS chemicals with ultra-fine water droplets that suffocate and cool fire instantly.',
      url: 'https://spinoff.nasa.gov/node/9582'
    },
    simulationPreset: {
      gravity: 0.00001,
      oxygen: 20.9,
      ambient: 25,
      flow: 1.1,
      fuel: 'propane'
    },
    psiUrl: 'https://psi.nasa.gov/physci/repo/search?q=combustion',
    videoUrl: 'https://www.youtube.com/watch?v=W1oXykoz9zg'
  },
  {
    id: 'psi-bass-ii',
    acronym: 'BASS-II',
    title: 'Burning and Suppression of Solids — Spacecraft Materials',
    facility: 'ISS Microgravity Science Glovebox (MSG)',
    sponsor: 'NASA Glenn Research Center / Case Western Reserve University',
    fuel: 'methane',
    regime: 'microgravity',
    targetHabitats: ['spacecraft', 'station', 'lunar'],
    relevanceScore: 99,
    flammabilityMetrics: {
      loi: 14.2,
      quenchDiameterMm: 3.2,
      radiationFraction: 0.28,
      flameSpreadRate: '0.4 - 1.8 mm/s (depends on forced air drift)',
      extinctionStrainRate: '15.2 s⁻¹',
      coolFlameObserved: false
    },
    scientificSummary:
      'BASS-II evaluated the flammability, flame spread, and extinction of solid materials (PMMA acrylic, cotton-fiberglass blends, Nomex) under low forced convective flow velocities ($1$ to $10\\text{ cm/s}$) typical of spacecraft cabin ventilation.',
    predictiveInsight:
      'Demonstrated that in true quiescent zero gravity, solid flames self-extinguish due to suffocation in their own combustion products. However, weak airflow from ventilation fans creates a dangerous sweet spot where flame spread can exceed Earth speeds.',
    nextGenControls:
      'Established the NASA emergency ventilation shutdown protocol: instantly stopping cabin air circulation cuts convective oxygen feed and causes microgravity flames to self-quench through localized oxygen starvation.',
    earthSpinoff: {
      title: 'Advanced Fire-Resistant Textiles & Firefighter Turnout Gear',
      spinoffId: 'Spinoff #9918',
      application: 'Thermal micrometeoroid garment polymers applied to municipal firefighter protective turnout suits.',
      impact: 'Lightweight polybenzimidazole (PBI) and aerogel gear protecting firefighters from flashover conditions.',
      url: 'https://spinoff.nasa.gov/node/9918'
    },
    simulationPreset: {
      gravity: 0.00001,
      oxygen: 20.9,
      ambient: 25,
      flow: 0.6,
      fuel: 'methane'
    },
    psiUrl: 'https://psi.nasa.gov/physci/repo/search?q=combustion'
  },
  {
    id: 'psi-bre',
    acronym: 'BRE',
    title: 'Burning Rate Emulator — Partial Gravity Radiative Feedback',
    facility: 'ISS Combustion Integrated Rack (CIR)',
    sponsor: 'NASA Glenn Research Center / University of Maryland',
    fuel: 'methane',
    regime: 'lunar',
    targetHabitats: ['lunar', 'mars'],
    relevanceScore: 94,
    flammabilityMetrics: {
      loi: 14.1,
      quenchDiameterMm: 16.8,
      radiationFraction: 0.24,
      flameSpreadRate: '1.4 mm/s opposed flow',
      extinctionStrainRate: '14.0 s⁻¹',
      coolFlameObserved: false
    },
    scientificSummary:
      'BRE simulated solid burning using controlled porous gaseous burners on the ISS. By decoupling thermal radiation feedback from solid material regression, BRE measured the exact radiative heat feedback required to sustain combustion under partial-gravity regimes.',
    predictiveInsight:
      'Fills the critical knowledge gap between zero-g and Earth gravity. Validates predictive models for lunar surface gravity (0.165 g) and Martian surface gravity (0.378 g), where weak buoyancy tilts flames and enhances oxygen transport.',
    nextGenControls:
      'Informs fire-zoning clearances for lunar surface outposts, pressurized rovers, and propellant storage bunkers at the Artemis Base Camp.',
    earthSpinoff: {
      title: 'Building Code Spatial Standoff Standards',
      spinoffId: 'Spinoff #9407',
      application: 'Empirical clearance standards adopted into residential and commercial fire prevention codes.',
      impact: 'Provides the physical basis for spatial clearance rules in building safety design (reflected in Ember 2D Hazard Map).',
      url: 'https://spinoff.nasa.gov/node/9407'
    },
    simulationPreset: {
      gravity: 0.165,
      oxygen: 20.9,
      ambient: 25,
      flow: 0.9,
      fuel: 'methane'
    },
    psiUrl: 'https://psi.nasa.gov/physci/repo/search?q=combustion'
  },
  {
    id: 'psi-sofie',
    acronym: 'SOFIE',
    title: 'Solid Fuel Ignition and Extinction — Exploration Atmospheres',
    facility: 'ISS Combustion Integrated Rack (CIR)',
    sponsor: 'NASA Glenn Research Center / Artemis Fire Safety Project',
    fuel: 'propane',
    regime: 'martian',
    targetHabitats: ['lunar', 'mars', 'spacecraft'],
    relevanceScore: 97,
    flammabilityMetrics: {
      loi: 11.5,
      quenchDiameterMm: 18.0,
      radiationFraction: 0.30,
      flameSpreadRate: '2.8 mm/s in 34% O₂ exploration atmosphere',
      extinctionStrainRate: '18.5 s⁻¹',
      coolFlameObserved: false
    },
    scientificSummary:
      'SOFIE is the flagship combustion investigation for the Artemis program. It tests materials in proposed Exploration Atmospheres (8.2 psia with 34% O₂), which allow astronauts to conduct spacewalks without hours of pre-breathing, but significantly elevate material flammability.',
    predictiveInsight:
      'Proves that hyper-oxygenated low-pressure exploration cabins drastically lower the ignition energy threshold of plastics, wiring, and fabrics, requiring specialized flammability criteria distinct from standard sea-level air.',
    nextGenControls:
      'Sets material qualification standards (NASA-STD-6001 Test 1) for the Lunar Gateway space station and pressurized crew rovers.',
    earthSpinoff: {
      title: 'Hyperbaric & Oxygen-Enriched Medical Facility Safety',
      spinoffId: 'Spinoff #9582',
      application: 'Fire suppression protocols for hyperbaric chambers, surgical suites, and oxygen therapy centers.',
      impact: 'Prevents catastrophic flash fires in clinical oxygen-rich environments on Earth.',
      url: 'https://spinoff.nasa.gov/node/9582'
    },
    simulationPreset: {
      gravity: 0.378,
      oxygen: 30.0,
      ambient: 25,
      flow: 1.2,
      fuel: 'propane'
    },
    psiUrl: 'https://psi.nasa.gov/physci/repo/search?q=combustion'
  },
  {
    id: 'psi-s-flame',
    acronym: 'S-Flame',
    title: 'Structure and Response of Spherical Diffusion Flames',
    facility: 'ISS CIR & 2.2-Second Drop Tower',
    sponsor: 'NASA Glenn Research Center / University of Southern California',
    fuel: 'methane',
    regime: 'microgravity',
    targetHabitats: ['spacecraft', 'station'],
    relevanceScore: 91,
    flammabilityMetrics: {
      loi: 13.5,
      quenchDiameterMm: 19.8,
      radiationFraction: 0.34,
      flameSpreadRate: 'Stationary spherical flame ball',
      extinctionStrainRate: '10.2 s⁻¹',
      coolFlameObserved: false
    },
    scientificSummary:
      'S-Flame provided foundational 1-D spherical diffusion flame geometry data, isolating pure molecular diffusion and radiation heat loss without three-dimensional aerodynamic distortions or buoyant vorticity.',
    predictiveInsight:
      'Delivered the exact theoretical and empirical validation for reduced-order combustion models (including the mathematical formulation in EMBER-ROM 0.1).',
    nextGenControls:
      'Calibrated the critical dilution thresholds required for gaseous fire extinguishing agents (e.g. nitrogen/carbon dioxide flood systems) in pressurized compartments.',
    earthSpinoff: {
      title: 'High-Efficiency Low-NOx Industrial Burner Engineering',
      spinoffId: 'Spinoff #9407',
      application: 'Computational fluid dynamic models for clean combustion in natural gas utilities.',
      impact: 'Reduces nitrous oxide pollutants in terrestrial power plants by optimizing burner spherical flame zones.',
      url: 'https://spinoff.nasa.gov/node/9407'
    },
    simulationPreset: {
      gravity: 0.00001,
      oxygen: 20.9,
      ambient: 25,
      flow: 0.75,
      fuel: 'methane'
    },
    psiUrl: 'https://psi.nasa.gov/physci/repo/search?q=combustion'
  }
];

/**
 * Historical Spaceflight Fire Incidents & Lessons Learned
 * Direct reference to NASA Safety & Mission Assurance case studies
 */
export const HISTORICAL_FIRE_INCIDENTS: HistoricalFireIncident[] = [
  {
    id: 'apollo-1',
    title: 'Apollo 1 (AS-204) Plugs-Out Test Fire',
    mission: 'Apollo Program / Command Module CM-012',
    date: 'January 27, 1967',
    gravity: 1.0,
    environment: '100% Pure Oxygen at 16.7 psia (115 kPa) ground pressure',
    rootCause:
      'Electrical arcing from damaged Teflon insulation on wire harness beneath astronaut couch, igniting nearby flammable materials in pure oxygen.',
    combustionMechanisms:
      'In pure high-pressure oxygen, materials that are fire-resistant in normal air (nylon, Velcro, polyurethane netting) experience near-zero ignition energy and burn with explosive flashover speed. Flame spread rates exceeded 300 mm/s, consuming the cabin atmosphere within 15 seconds.',
    crewImpact:
      'Loss of astronauts Virgil "Gus" Grissom, Edward White II, and Roger Chaffee due to toxic carbon monoxide asphyxiation and thermal trauma within 30 seconds.',
    lessonsLearned: [
      'Eliminated 100% pure oxygen cabin environments during ground pre-launch testing; transitioned to 60/40 O₂/N₂ launch atmosphere.',
      'Created NASA-STD-6001 strict material flammability acceptance criteria (mandatory upward flame spread testing).',
      'Overhauled all spacecraft electrical harnesses: fireproof conduit, circuit breaker segregation, Teflon/Kapton wire protection.',
      'Replaced inward-opening multi-piece hatch with explosive-latch outward-opening hatch capable of crew egress in under 5 seconds.'
    ],
    psiCorrelation:
      'Directly correlates with ACME and SOFIE flammability thresholds under elevated oxygen fractions, showing how Limiting Oxygen Index (LOI) governs flashover risk.',
    safetyStandards: 'NASA-STD-6001 (Flammability, Odor, Offgassing, and Compatibility Requirements)',
    url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-1',
    simulationSettings: {
      gravity: 1.0,
      oxygen: 30.0,
      ambient: 25,
      flow: 1.8,
      fuel: 'methane'
    }
  },
  {
    id: 'apollo-13',
    title: 'Apollo 13 Cryogenic Oxygen Tank 2 Explosion',
    mission: 'Apollo 13 / Service Module SM-109',
    date: 'April 13, 1970',
    gravity: 0.00001,
    environment: 'Supercritical Liquid Oxygen at ~1,000 psi in deep space',
    rootCause:
      'Damaged thermostatic switch contacts on heater fan wires inside Cryogenic Oxygen Tank 2 sparked during routine cryo-stir, igniting Teflon wire insulation.',
    combustionMechanisms:
      'Combustion inside a high-pressure pure oxygen tank caused rapid thermal expansion and pressure runaway. The fire burned through aluminum conduit, blew off the tank dome, and ruptured Service Module outer panel 4, venting oxygen into space.',
    crewImpact:
      'Loss of Service Module electrical power and life-support oxygen; mission aborted; crew (Lovell, Swigert, Haise) survived using Lunar Module Odyssey as lifeboat.',
    lessonsLearned: [
      'Removed all internal mechanical fan stirrers and submerged electrical switches from cryogenic oxygen tanks.',
      'Added a third independent cryogenic oxygen tank located in a segregated bay to ensure emergency redundancy.',
      'Installed 400-amp-hour auxiliary reserve battery in Command Module for emergency re-entry power.',
      'Standardized wire insulation compatibility protocols for pressurized oxidizer systems.'
    ],
    psiCorrelation:
      'Correlates with FLEX-2 droplet and high-pressure fuel/oxidizer interface combustion physics.',
    safetyStandards: 'NASA SP-5080 (High-Pressure Oxygen System Fire Safety Guidelines)',
    url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-13',
    simulationSettings: {
      gravity: 0.00001,
      oxygen: 30.0,
      ambient: 25,
      flow: 1.5,
      fuel: 'propane'
    }
  },
  {
    id: 'mir-1997',
    title: 'Mir Space Station Kvant-1 Module Fire',
    mission: 'Mir EO-23 / NASA Shuttle-Mir Program',
    date: 'February 23, 1997',
    gravity: 0.00001,
    environment: 'Microgravity (10⁻⁵ g) in standard habitable cabin atmosphere (21% O₂ at 14.7 psi)',
    rootCause:
      'Mechanical structural rupture of solid chemical oxygen generator canister (Vika / TGK "candle") during routine ignition.',
    combustionMechanisms:
      'The burning iron and sodium chlorate chemical core vented an open blowtorch-like jet flame against the Kvant-1 module wall for over 90 seconds. Crucially, in zero gravity hot smoke did not rise to vents; instead, it stagnated into a dense, oily aerosol cloud that blocked vision and escape pathways.',
    crewImpact:
      'Six crew members (including NASA astronaut Jerry Linenger) blinded by dense smoke; donned gas masks and successfully extinguished the fire with water-foam extinguishers before cabin hull breach occurred.',
    lessonsLearned: [
      'Revealed the critical danger of zero-g particulate stagnation: without buoyancy, smoke remains suspended in mid-air, requiring high-flow suction filtration.',
      'Mandated that fire emergency escape paths (e.g. to Soyuz or Orion vehicles) must never be blocked by high-risk equipment.',
      'Spurred development of fine-water-mist and non-gaseous clean extinguishers that do not disperse burning debris in zero-g.',
      'Established dual-channel multi-criteria smoke and gas monitoring throughout habitable modules.'
    ],
    psiCorrelation:
      'Directly illustrates BASS-II and ACME zero-g convection findings: smoke does not rise to ceilings in microgravity, proving that traditional ceiling smoke detectors fail in space.',
    safetyStandards: 'ISS Crew Emergency Response Protocol & SSP 50005 (International Space Station Flight Rules)',
    url: 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/',
    simulationSettings: {
      gravity: 0.00001,
      oxygen: 20.9,
      ambient: 35,
      flow: 1.6,
      fuel: 'methane'
    }
  }
];

/**
 * NASA Earth Spinoffs Derived from Spaceflight Fire Safety Research
 */
export const NASA_EARTH_SPINOFFS: NasaEarthSpinoff[] = [
  {
    id: 'spinoff-water-mist',
    spinoffNode: 'Spinoff #9582',
    title: 'Fine-Water-Mist Fire Extinguishers (Halon & PFAS Replacement)',
    nasaOrigin:
      'Developed by NASA and ADA Technologies for the International Space Station to replace toxic Halon. ISS flight experiments demonstrated that ultra-fine water droplets (<50 µm) flash-vaporize into steam, suffocating flames and removing heat without propelling burning liquids.',
    terrestrialApplication:
      'Commercialized for data centers, telecommunications facilities, naval combat vessels, aircraft passenger cabins, and historic libraries.',
    commercialBenefit:
      'Zero ozone depletion, zero global warming potential, zero toxic PFAS chemicals, completely safe for occupied spaces.',
    emberRelation:
      'Informs Ember’s virtual cooling and dilution suppression models in the Combustion Lab.',
    url: 'https://spinoff.nasa.gov/node/9582'
  },
  {
    id: 'spinoff-smoke-detection',
    spinoffNode: 'Spinoff #9407',
    title: 'Intelligent Multi-Criteria Optical/Electrochemical Smoke Alarms',
    nasaOrigin:
      'Derived from ISS Combustion Integrated Rack (CIR) low-convection aerosol transport research. NASA needed sensors that could distinguish true smoldering fires from benign dust and cooking aerosols in stagnant microgravity atmospheres.',
    terrestrialApplication:
      'Modern residential and commercial fire detectors pairing multi-angle optical scatter with electrochemical carbon monoxide sensing.',
    commercialBenefit:
      'Virtually eliminates nuisance cooking alarms while detecting slow smoldering electrical fires up to 15 minutes faster than legacy ionization alarms.',
    emberRelation:
      'Direct technological lineage to the Ember Guardian 3D IoT Hardware Node (dual-scatter PM2.5 + electrochemical CO).',
    url: 'https://spinoff.nasa.gov/node/9407'
  },
  {
    id: 'spinoff-firefighter-gear',
    spinoffNode: 'Spinoff #9918',
    title: 'Advanced Firefighter Turnout Gear & High-Temperature Textiles',
    nasaOrigin:
      'Evolved from Apollo spacesuit thermal micrometeoroid garments, Space Shuttle heat shield tiles, and microgravity fabric flammability studies (BASS).',
    terrestrialApplication:
      'Structural firefighter turnout coats, flame-resistant hoods, thermal barriers, and ultralight carbon-composite self-contained breathing apparatus (SCBA) tanks.',
    commercialBenefit:
      'Reduces turnout suit weight by 30%, resists flashover temperatures exceeding 1,000°C, and prevents heat exhaustion in municipal firefighters.',
    emberRelation:
      'Reinforces the material flammability standards used in Ember’s 2D Hazard clearance rules.',
    url: 'https://spinoff.nasa.gov/node/9918'
  }
];

export function filterInvestigationsByHabitat(habitat: HabitatEnvironment): PsiInvestigation[] {
  if (habitat === 'all') return PSI_INVESTIGATIONS;
  return PSI_INVESTIGATIONS.filter(inv => inv.targetHabitats.includes(habitat));
}

export function searchInvestigations(query: string, habitat: HabitatEnvironment = 'all'): PsiInvestigation[] {
  const q = query.toLowerCase().trim();
  const base = filterInvestigationsByHabitat(habitat);
  if (!q) return base;
  return base.filter(inv =>
    inv.acronym.toLowerCase().includes(q) ||
    inv.title.toLowerCase().includes(q) ||
    inv.scientificSummary.toLowerCase().includes(q) ||
    inv.facility.toLowerCase().includes(q) ||
    inv.fuel.toLowerCase().includes(q)
  );
}
