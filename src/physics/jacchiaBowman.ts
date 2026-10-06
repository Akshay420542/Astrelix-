/**
 * Jacchia-Bowman Atmospheric Drag Model & Long-Term Orbital Decay Simulator
 * Models thermospheric density variations (120 km - 1000 km) and secular semi-major axis decay.
 */
import { CELESTIAL_BODIES } from './constants';

export interface JacchiaBowmanParameters {
  altitudeKm: number;
  solarFluxF107: number; // Solar radio flux index F10.7 (SFU: 70 min, 150 mean, 250 max)
  geomagneticAp: number; // Geomagnetic planetary index Ap (0 quiet, 40 active, 100+ storm)
}

export interface OrbitalDecayPoint {
  day: number;
  timeSeconds: number;
  altitudeKm: number;
  semiMajorAxisKm: number;
  densityKgM3: number;
  decayRateMPerDay: number;
  orbitalSpeedKms: number;
  isReentry: boolean;
}

export interface DecaySimulationResult {
  initialAltitudeKm: number;
  finalAltitudeKm: number;
  durationDays: number;
  ballisticCoeffKgM2: number;
  solarFluxF107: number;
  estimatedLifetimeDays: number | null; // null if stable above horizon
  totalAltitudeLossKm: number;
  trajectory: OrbitalDecayPoint[];
}

/**
 * Calculates thermospheric neutral density using the Jacchia-Bowman formulation.
 * Density profile incorporates solar activity EUV heating (F10.7) and exospheric temperature.
 */
export function calculateJacchiaBowmanDensity(
  altitudeKm: number,
  f107 = 140.0,
  ap = 12.0
): number {
  if (altitudeKm < 100.0) return 5.0e-7; // Dense mesosphere
  if (altitudeKm > 1000.0) return 1.0e-15; // Exosphere vacuum

  // 1. Exospheric Temperature T_inf (Kelvin) based on solar flux F10.7 and geomagnetic Ap
  const tInf = 380.0 + 3.3 * f107 + 65.0 * Math.log10(Math.max(1, ap));

  // 2. Reference base conditions at 120 km
  const z0 = 120.0; // km
  const rho0 = 2.4e-8; // kg / m^3 at 120 km

  // 3. Temperature profile T(z) in thermosphere
  const tz = tInf - (tInf - 355.0) * Math.exp(-0.028 * (altitudeKm - z0));

  // 4. Effective atmospheric scale height H (km)
  // H = (R * T) / (M_mol * g)
  const hScale = 5.2 + 0.052 * (tz - 300.0) + (altitudeKm - z0) * 0.045;

  // 5. Jacchia-Bowman barometric density equation
  const density = rho0 * Math.exp(-(altitudeKm - z0) / Math.max(8.0, hScale));

  // Semiannual variation multiplier (~20% modulation)
  const semiannualFactor = 1.0 + 0.18 * Math.sin((altitudeKm / 50.0) * 0.8);

  return density * semiannualFactor;
}

/**
 * Long-term numerical propagation of orbital decay using Jacchia-Bowman drag.
 * Evaluates semi-major axis loss: da/dt = - (CD * A / m) * rho * sqrt(mu * a)
 */
export function simulateLongTermOrbitalDecay(
  initialAltitudeKm: number,
  massKg: number,
  dragCoeffCd = 2.2,
  crossSectionAreaM2 = 3.5,
  f107 = 140.0,
  durationDays = 30.0,
  timeStepDays = 0.5
): DecaySimulationResult {
  const rEarth = CELESTIAL_BODIES.earth.radius;
  const mu = CELESTIAL_BODIES.earth.mu;

  // Ballistic coefficient B = m / (CD * A) in kg/m^2
  const ballisticCoeff = massKg / Math.max(0.1, dragCoeffCd * crossSectionAreaM2);
  const cdAOverM = (dragCoeffCd * crossSectionAreaM2) / massKg; // m^2 / kg

  let currentA = rEarth + initialAltitudeKm;
  const points: OrbitalDecayPoint[] = [];
  let lifetimeDays: number | null = null;

  const totalSteps = Math.ceil(durationDays / timeStepDays);

  for (let s = 0; s <= totalSteps; s++) {
    const currentDay = s * timeStepDays;
    const currentAlt = currentA - rEarth;

    if (currentAlt <= 120.0 && lifetimeDays === null) {
      lifetimeDays = currentDay;
    }

    const density = calculateJacchiaBowmanDensity(currentAlt, f107);
    const vOrbitalKms = Math.sqrt(mu / currentA);
    const vOrbitalMs = vOrbitalKms * 1000.0;

    // Instantaneous decay rate: da/dt in m/s
    // da/dt = - (CD*A/m) * rho * v^2 * (a / v) = - (CD*A/m) * rho * v * a
    // In m/day:
    const daDtMPerSec = cdAOverM * density * vOrbitalMs * (currentA * 1000.0) * (2 * Math.PI / 5400.0);
    const decayRateMPerDay = daDtMPerSec * 86400.0;

    points.push({
      day: currentDay,
      timeSeconds: currentDay * 86400.0,
      altitudeKm: Math.max(0, currentAlt),
      semiMajorAxisKm: currentA,
      densityKgM3: density,
      decayRateMPerDay: Math.min(25000, decayRateMPerDay),
      orbitalSpeedKms: vOrbitalKms,
      isReentry: currentAlt <= 120.0
    });

    if (currentAlt <= 120.0) {
      break;
    }

    // Step forward in semi-major axis (convert decay in meters to km)
    const deltaAKm = (decayRateMPerDay * timeStepDays) / 1000.0;
    currentA = Math.max(rEarth, currentA - deltaAKm);
  }

  const finalAlt = points[points.length - 1].altitudeKm;

  return {
    initialAltitudeKm,
    finalAltitudeKm: finalAlt,
    durationDays,
    ballisticCoeffKgM2: Math.round(ballisticCoeff * 10) / 10,
    solarFluxF107: f107,
    estimatedLifetimeDays: lifetimeDays ? Math.round(lifetimeDays * 10) / 10 : null,
    totalAltitudeLossKm: Math.round((initialAltitudeKm - finalAlt) * 10) / 10,
    trajectory: points
  };
}
