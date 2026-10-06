/**
 * Automated Orbit Transfer & Maneuver Planner
 * Hohmann Transfer, Bi-Elliptic Transfer, and Plane Changes
 */
import { SpacecraftConfig, TransferResult } from '../types/mission';
import { CELESTIAL_BODIES } from './constants';

export function calculateHohmannTransfer(
  r1Km: number,
  r2Km: number,
  spacecraft: SpacecraftConfig,
  mu = CELESTIAL_BODIES.earth.mu
): TransferResult {
  const v1 = Math.sqrt(mu / r1Km);
  const v2 = Math.sqrt(mu / r2Km);

  // Semi-major axis of transfer ellipse
  const at = (r1Km + r2Km) / 2;

  // Velocity at periapsis and apoapsis of transfer orbit
  const vtPeriapsis = Math.sqrt(mu * (2 / r1Km - 1 / at));
  const vtApoapsis = Math.sqrt(mu * (2 / r2Km - 1 / at));

  const dv1Kms = Math.abs(vtPeriapsis - v1);
  const dv2Kms = Math.abs(v2 - vtApoapsis);
  const totalDvKms = dv1Kms + dv2Kms;

  const dv1Ms = dv1Kms * 1000;
  const dv2Ms = dv2Kms * 1000;
  const totalDvMs = totalDvKms * 1000;

  // Transfer time: half of orbital period
  const transferTimeSec = Math.PI * Math.sqrt(Math.pow(at, 3) / mu);

  // Tsiolkovsky Rocket Equation
  const mInitial = spacecraft.dryMass + spacecraft.fuelMass;
  const veMs = spacecraft.isp * 9.80665;
  const fuelBurn1 = mInitial * (1 - Math.exp(-dv1Ms / veMs));
  const mAfterBurn1 = mInitial - fuelBurn1;
  const fuelBurn2 = mAfterBurn1 * (1 - Math.exp(-dv2Ms / veMs));
  const totalFuelUsed = fuelBurn1 + fuelBurn2;

  return {
    type: 'HOHMANN',
    r1: r1Km,
    r2: r2Km,
    semiMajorAxisTransfer: at,
    deltaV1: dv1Ms,
    deltaV2: dv2Ms,
    totalDeltaV: totalDvMs,
    transferTimeSec,
    transferTimeHours: transferTimeSec / 3600,
    fuelConsumedKg: totalFuelUsed,
    isFeasible: totalFuelUsed <= spacecraft.fuelMass
  };
}

export function calculateBiEllipticTransfer(
  r1Km: number,
  r2Km: number,
  rbKm: number, // Intermediate apogee
  spacecraft: SpacecraftConfig,
  mu = CELESTIAL_BODIES.earth.mu
): TransferResult {
  const v1 = Math.sqrt(mu / r1Km);
  const v2 = Math.sqrt(mu / r2Km);

  // Transfer ellipse 1: r1 to rb
  const at1 = (r1Km + rbKm) / 2;
  const vt1A = Math.sqrt(mu * (2 / r1Km - 1 / at1));
  const vt1B = Math.sqrt(mu * (2 / rbKm - 1 / at1));
  const dv1 = Math.abs(vt1A - v1);

  // Transfer ellipse 2: rb to r2
  const at2 = (r2Km + rbKm) / 2;
  const vt2B = Math.sqrt(mu * (2 / rbKm - 1 / at2));
  const vt2C = Math.sqrt(mu * (2 / r2Km - 1 / at2));
  const dv2 = Math.abs(vt2B - vt1B);

  const dv3 = Math.abs(v2 - vt2C);
  const totalDvKms = dv1 + dv2 + dv3;

  const transferTimeSec =
    Math.PI * Math.sqrt(Math.pow(at1, 3) / mu) +
    Math.PI * Math.sqrt(Math.pow(at2, 3) / mu);

  const mInitial = spacecraft.dryMass + spacecraft.fuelMass;
  const veMs = spacecraft.isp * 9.80665;
  const fuelUsed = mInitial * (1 - Math.exp(-(totalDvKms * 1000) / veMs));

  return {
    type: 'BI_ELLIPTIC',
    r1: r1Km,
    r2: r2Km,
    semiMajorAxisTransfer: at1,
    deltaV1: dv1 * 1000,
    deltaV2: (dv2 + dv3) * 1000,
    totalDeltaV: totalDvKms * 1000,
    transferTimeSec,
    transferTimeHours: transferTimeSec / 3600,
    fuelConsumedKg: fuelUsed,
    isFeasible: fuelUsed <= spacecraft.fuelMass
  };
}

export function calculatePlaneChangeDeltaV(
  vKms: number,
  deltaIDeg: number
): { deltaV: number; formula: string } {
  const deltaIRad = (deltaIDeg * Math.PI) / 180;
  const dvKms = 2 * vKms * Math.sin(deltaIRad / 2);
  return {
    deltaV: dvKms * 1000,
    formula: `Δv = 2·v·sin(Δi / 2) = 2 · ${vKms.toFixed(2)} · sin(${(deltaIDeg / 2).toFixed(2)}°)`
  };
}
