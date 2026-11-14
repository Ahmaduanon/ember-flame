/** EMBER-ROM 0.1: uncalibrated educational lumped thermal/species model.
 * Integrates fuel and oxygen inventories (mg) and gas temperature (K).
 * Not CFD: no pressure/velocity solution, detailed chemistry, soot or cool flames.
 */
import type { NasaCalibrationDataset } from './nasa-data';

export type Fuel = 'methane' | 'propane' | 'ethanol';
export type Settings = { gravity: number; oxygen: number; ambient: number; flow: number; fuel: Fuel };
export type Intervention = 'none' | 'cutoff' | 'dilution' | 'cooling';
export type SimState = { time: number; temperature: number; oxygenMass: number; fuelMass: number; burning: boolean; weakTime: number; release: number; loss: number; radiation: number; convection: number; size: number; rate: number; status: 'stable' | 'weak' | 'extinguished' };
export type Point = { time: number; temperature: number; release: number; loss: number; oxygenMass: number; fuelMass: number; size: number };
export const MODEL_VERSION = 'EMBER-ROM 0.1';
export const DEFAULTS: Settings = { gravity: 1, oxygen: 20.9, ambient: 25, flow: 0.85, fuel: 'methane' };
export const FUELS = {
  methane: { name: 'Methane', formula: 'CH₄', heat: 50, stoich: 4 },
  propane: { name: 'Propane', formula: 'C₃H₈', heat: 46.4, stoich: 3.636 },
  ethanol: { name: 'Ethanol vapor', formula: 'C₂H₅OH', heat: 26.8, stoich: 2.087 },
};
export const PRESETS = [
  { name: 'Earth', gravity: 1, label: '1.000 g', icon: 'earth' },
  { name: 'Moon', gravity: 0.165, label: '0.165 g', icon: 'moon' },
  { name: 'Mars', gravity: 0.378, label: '0.378 g', icon: 'mars' },
  { name: 'Microgravity', gravity: 0.00001, label: '10⁻⁵ g', icon: 'orbit' },
];
export const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
export function oxygenCapacity(percent: number) {
  const x = clamp(percent / 100, 0, 1);
  return 8 * (32 * x) / (32 * x + 28 * (1 - x));
}
export function initialState(settings: Settings = DEFAULTS): SimState {
  return { time: 0, temperature: 1300, oxygenMass: oxygenCapacity(settings.oxygen), fuelMass: 0.24, burning: true, weakTime: 0, release: 0, loss: 0, radiation: 0, convection: 0, size: 0, rate: 0, status: 'stable' };
}
export function step(state: SimState, p: Settings, action: Intervention, dt = 0.02, dataset?: NasaCalibrationDataset): SimState {
  dt = clamp(dt, 0.001, 0.025);
  const ambient = p.ambient + 273.15;
  const grav = Math.sqrt(clamp(p.gravity, 0, 2));
  const mixing = 0.9 + 4 * grav;
  const fuel = FUELS[p.fuel];
  const o2 = oxygenCapacity(action === 'dilution' ? Math.min(p.oxygen, 9) : p.oxygen);
  const feed = action === 'cutoff' ? 0 : p.flow;
  let f = Math.max(0, state.fuelMass + feed * dt);
  let o = Math.max(0, state.oxygenMass + mixing * (o2 - state.oxygenMass) * dt);
  const activation = state.burning ? clamp((state.temperature - 650) / 550, 0, 1) : 0;
  const rate = Math.min(f / 0.18, o / (fuel.stoich * 0.18)) * activation;
  const reacted = Math.min(rate * dt, f, o / fuel.stoich);
  f = (f - reacted) * Math.exp(-mixing * 0.12 * dt);
  o = Math.max(0, o - reacted * fuel.stoich);
  const actualRate = reacted / dt;
  const release = actualRate * fuel.heat;
  const radFrac = dataset ? dataset.radiationFraction : 0.12;
  const area = 0.00020 * (1 + 0.65 / (1 + 8 * grav)) * Math.sqrt(p.flow / 0.85);
  const radiation = radFrac * 5.670374419e-8 * area * Math.max(0, Math.pow(state.temperature, 4) - Math.pow(ambient, 4));
  const convection = (0.009 + area * (7 + 7 * grav)) * Math.max(0, state.temperature - ambient) * (action === 'cooling' ? 4 : 1);
  const loss = radiation + convection;
  const temperature = Math.max(ambient, state.temperature + (release - loss) * dt / 0.045);
  const weakTime = temperature < 700 || actualRate < 0.015 ? state.weakTime + dt : 0;
  const burning = state.burning && weakTime < 1.2;
  const status = !burning ? 'extinguished' : temperature < 1100 || actualRate < p.flow * 0.28 ? 'weak' : 'stable';
  const baseSize = dataset ? dataset.effectiveQuenchDiameterMm : 17;
  const size = burning ? baseSize * Math.sqrt(Math.max(0, actualRate) / 0.65) * (1 + 0.45 / (1 + 5 * grav)) : 0;
  return { time: state.time + dt, temperature, oxygenMass: o, fuelMass: f, burning, weakTime, release, loss, radiation, convection, size, rate: actualRate, status };
}
export function computeInstantaneousState(state: SimState, p: Settings, action: Intervention = 'none', dataset?: NasaCalibrationDataset): SimState {
  if (!state.burning) {
    const ambient = p.ambient + 273.15;
    return { ...state, temperature: ambient, release: 0, loss: 0, size: 0, rate: 0, status: 'extinguished' };
  }
  let s = { ...state };
  for (let i = 0; i < 4; i++) {
    s = step(s, p, action, 0.025, dataset);
  }
  return { ...s, time: state.time };
}
export function sample(s: SimState): Point {
  const {time, temperature, release, loss, oxygenMass, fuelMass, size} = s;
  return {time, temperature, release, loss, oxygenMass, fuelMass, size};
}
export function gravityLabel(g: number) { return g < 0.001 ? (g === 0 ? '0 g' : g.toExponential(0) + ' g') : g.toFixed(3) + ' g'; }
export function regime(g: number) { return g < 0.005 ? 'Diffusion dominated' : g < 0.4 ? 'Mixed transport' : 'Buoyancy enhanced'; }
