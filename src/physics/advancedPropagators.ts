/**
 * Advanced Multi-Body Perturbations, Conjunction Risk Assessment, Link Budget & Contingency Solvers
 * Implements high-order zonal harmonics (J2, J3, J4), Moon/Sun third-body gravity,
 * Cannonball Solar Radiation Pressure (SRP), Foster Pc collision probability, and RF link budget.
 */
import { CELESTIAL_BODIES } from './constants';
import {
  ConjunctionEvent,
  ContingencySimulation,
  LinkBudgetCalculation,
  MultiBodyConfig,
  RfFrequencyBand
} from '../types/advancedFeatures';
import { SpacecraftConfig } from '../types/mission';

// High-Order Zonal Harmonics for Earth
export const J2_EARTH = 1.08263e-3;
export const J3_EARTH = -2.5327e-6;
export const J4_EARTH = -1.6196e-6;

// Astronomical Constants
export const AU_KM = 149597870.7; // 1 Astronomical Unit in km
export const SOLAR_PRESSURE_P0_NM2 = 4.56e-6; // N / m^2 at 1 AU

/**
 * High-Order Earth Gravity Harmonics Acceleration (J2, J3, J4)
 */
export function calculateHighOrderZonalAcceleration(
  r: [number, number, number],
  j2Enabled = true,
  j3Enabled = true,
  j4Enabled = true,
  mu = CELESTIAL_BODIES.earth.mu,
  radius = CELESTIAL_BODIES.earth.radius
): [number, number, number] {
  const rMag = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]);
  if (rMag < 1e-4) return [0, 0, 0];

  const x = r[0];
  const y = r[1];
  const z = r[2];
  const zR = z / rMag;
  const z2R2 = zR * zR;

  let ax = 0;
  let ay = 0;
  let az = 0;

  // J2 Oblateness
  if (j2Enabled) {
    const factorJ2 = (-1.5 * J2_EARTH * mu * radius * radius) / Math.pow(rMag, 5);
    ax += factorJ2 * x * (1 - 5 * z2R2);
    ay += factorJ2 * y * (1 - 5 * z2R2);
    az += factorJ2 * z * (3 - 5 * z2R2);
  }

  // J3 Pear-Shape Asymmetry
  if (j3Enabled) {
    const factorJ3 = (-2.5 * J3_EARTH * mu * Math.pow(radius, 3)) / Math.pow(rMag, 7);
    ax += factorJ3 * x * (zR * (3 - 7 * z2R2));
    ay += factorJ3 * y * (zR * (3 - 7 * z2R2));
    az += factorJ3 * (z * (6 * zR - 7 * Math.pow(zR, 3)) - (3 / 5) * rMag);
  }

  // J4 Higher-Order Octupole
  if (j4Enabled) {
    const factorJ4 = (-1.875 * J4_EARTH * mu * Math.pow(radius, 4)) / Math.pow(rMag, 7);
    ax += factorJ4 * x * (1 - 14 * z2R2 + 21 * z2R2 * z2R2);
    ay += factorJ4 * y * (1 - 14 * z2R2 + 21 * z2R2 * z2R2);
    az += factorJ4 * z * (5 - 70 / 3 * z2R2 + 21 * z2R2 * z2R2);
  }

  return [ax, ay, az];
}

/**
 * Third-Body Gravitational Perturbations (Moon and Sun)
 */
export function calculateThirdBodyAcceleration(
  rSat: [number, number, number],
  timeSec: number,
  includeMoon = true,
  includeSun = true
): [number, number, number] {
  let ax = 0;
  let ay = 0;
  let az = 0;

  // 1. Lunar Third-Body Point-Mass
  if (includeMoon) {
    const muMoon = CELESTIAL_BODIES.moon.mu; // 4902.8 km^3/s^2
    const dMoon = 384400.0; // km
    const moonPeriodSec = 27.32166 * 86400;
    const moonTheta = (timeSec * 2 * Math.PI) / moonPeriodSec;
    const moonIncRad = (5.145 * Math.PI) / 180;

    const rMoon: [number, number, number] = [
      dMoon * Math.cos(moonTheta),
      dMoon * Math.sin(moonTheta) * Math.cos(moonIncRad),
      dMoon * Math.sin(moonTheta) * Math.sin(moonIncRad)
    ];

    const dRel: [number, number, number] = [
      rMoon[0] - rSat[0],
      rMoon[1] - rSat[1],
      rMoon[2] - rSat[2]
    ];
    const dRelMag = Math.sqrt(dRel[0] * dRel[0] + dRel[1] * dRel[1] + dRel[2] * dRel[2]);
    const rMoonMag = Math.sqrt(rMoon[0] * rMoon[0] + rMoon[1] * rMoon[1] + rMoon[2] * rMoon[2]);

    ax += muMoon * (dRel[0] / Math.pow(dRelMag, 3) - rMoon[0] / Math.pow(rMoonMag, 3));
    ay += muMoon * (dRel[1] / Math.pow(dRelMag, 3) - rMoon[1] / Math.pow(rMoonMag, 3));
    az += muMoon * (dRel[2] / Math.pow(dRelMag, 3) - rMoon[2] / Math.pow(rMoonMag, 3));
  }

  // 2. Solar Third-Body Point-Mass
  if (includeSun) {
    const muSun = CELESTIAL_BODIES.sun.mu; // 132712440018.0 km^3/s^2
    const yearSec = 365.25636 * 86400;
    const sunTheta = (timeSec * 2 * Math.PI) / yearSec;
    const eclipticObliquityRad = (23.43929 * Math.PI) / 180;

    const rSun: [number, number, number] = [
      AU_KM * Math.cos(sunTheta),
      AU_KM * Math.sin(sunTheta) * Math.cos(eclipticObliquityRad),
      AU_KM * Math.sin(sunTheta) * Math.sin(eclipticObliquityRad)
    ];

    const dRelSun: [number, number, number] = [
      rSun[0] - rSat[0],
      rSun[1] - rSat[1],
      rSun[2] - rSat[2]
    ];
    const dRelSunMag = Math.sqrt(dRelSun[0] * dRelSun[0] + dRelSun[1] * dRelSun[1] + dRelSun[2] * dRelSun[2]);

    ax += muSun * (dRelSun[0] / Math.pow(dRelSunMag, 3) - rSun[0] / Math.pow(AU_KM, 3));
    ay += muSun * (dRelSun[1] / Math.pow(dRelSunMag, 3) - rSun[1] / Math.pow(AU_KM, 3));
    az += muSun * (dRelSun[2] / Math.pow(dRelSunMag, 3) - rSun[2] / Math.pow(AU_KM, 3));
  }

  return [ax, ay, az];
}

/**
 * Cannonball Solar Radiation Pressure (SRP)
 */
export function calculateSolarRadiationPressureAcceleration(
  rSat: [number, number, number],
  massKg: number,
  areaM2: number,
  cr = 1.2
): [number, number, number] {
  // Approximate Sun unit vector in ECI
  const rSunUnit = [1.0, 0.2, 0.0]; // Direction pointing from Earth to Sun
  const pSrpN = SOLAR_PRESSURE_P0_NM2 * cr * areaM2; // Force in Newtons
  const aSrpMs2 = pSrpN / Math.max(1, massKg); // m/s^2
  const aSrpKms2 = aSrpMs2 / 1000.0; // km/s^2

  return [
    -aSrpKms2 * rSunUnit[0],
    -aSrpKms2 * rSunUnit[1],
    -aSrpKms2 * rSunUnit[2]
  ];
}

/**
 * RF Link-Budget Solver
 */
export function computeRfLinkBudget(
  band: RfFrequencyBand,
  distanceKm: number,
  elevationDeg: number,
  txPowerWatts = 20.0,
  spacecraftAntennaGainDbi = 24.0,
  dataRateMbps = 150.0,
  groundStationGTDbK = 32.5
): LinkBudgetCalculation {
  let freqGhz = 2.2;
  let requiredEbN0Db = 4.5;
  let atmLossDb = 0.4;

  if (band === 'S_BAND') {
    freqGhz = 2.25;
    requiredEbN0Db = 3.5;
    atmLossDb = 0.3 + (elevationDeg < 10 ? 0.8 : 0.1);
  } else if (band === 'X_BAND') {
    freqGhz = 8.45;
    requiredEbN0Db = 4.2;
    atmLossDb = 0.6 + (elevationDeg < 10 ? 1.5 : 0.2);
  } else if (band === 'KA_BAND') {
    freqGhz = 26.5;
    requiredEbN0Db = 5.5;
    atmLossDb = 1.8 + (elevationDeg < 10 ? 4.2 : 0.5);
  } else if (band === 'OPTICAL_LASER') {
    freqGhz = 193400.0; // 1550 nm optical carrier
    requiredEbN0Db = 6.0;
    atmLossDb = 2.5 + (elevationDeg < 10 ? 8.0 : 1.0);
  }

  // EIRP (dBW) = 10 * log10(P_t) + G_t
  const ptDbw = 10 * Math.log10(Math.max(0.1, txPowerWatts));
  const eirpDbw = ptDbw + spacecraftAntennaGainDbi;

  // Free Space Path Loss (FSPL) in dB: 20*log10(d) + 20*log10(f_ghz) + 92.45
  const fsplDb = 20 * Math.log10(Math.max(100, distanceKm)) + 20 * Math.log10(freqGhz) + 92.45;

  // Boltzmann constant k = -228.6 dBW/(Hz*K)
  const kDb = -228.6;

  // Carrier to Noise Density Ratio (C/N0 in dB-Hz)
  const cN0DbHz = eirpDbw - fsplDb - atmLossDb + groundStationGTDbK - kDb;

  // Energy per bit to Noise Ratio (Eb/N0 in dB) = C/N0 - 10*log10(DataRate in bps)
  const dataRateBps = dataRateMbps * 1e6;
  const ebN0Db = cN0DbHz - 10 * Math.log10(Math.max(1000, dataRateBps));

  // Link Margin (dB)
  const linkMarginDb = ebN0Db - requiredEbN0Db;

  let linkStatus: LinkBudgetCalculation['linkStatus'] = 'CLOSED_NOMINAL';
  if (linkMarginDb < 0) {
    linkStatus = 'LINK_DOWN';
  } else if (linkMarginDb < 3.0) {
    linkStatus = 'DEGRADED_MARGIN';
  }

  return {
    frequencyBand: band,
    frequencyGhz: freqGhz,
    groundStationCode: 'KSC',
    distanceKm,
    elevationDeg,
    transmitterPowerWatts: txPowerWatts,
    spacecraftAntennaGainDbi,
    eirpDbw: Math.round(eirpDbw * 10) / 10,
    freeSpacePathLossDb: Math.round(fsplDb * 10) / 10,
    atmosphericAttenuationDb: Math.round(atmLossDb * 10) / 10,
    groundStationGTDbK,
    dataRateMbps,
    receivedCarrierToNoiseDbHz: Math.round(cN0DbHz * 10) / 10,
    energyPerBitToNoiseDb: Math.round(ebN0Db * 10) / 10,
    requiredEbN0Db,
    linkMarginDb: Math.round(linkMarginDb * 10) / 10,
    linkStatus
  };
}

/**
 * Space Domain Awareness: Collision Probability (Foster 1992 Algorithm Approximation)
 */
export function computeCollisionProbability(
  missDistanceKm: number,
  combinedRadiusMeters = 15.0,
  sigma1SigmaKm = 0.8
): number {
  const dMeters = missDistanceKm * 1000.0;
  const sigmaM = sigma1SigmaKm * 1000.0;
  // 2D Gaussian density approximation over encounter collision circle
  const exponent = -(dMeters * dMeters) / (2 * sigmaM * sigmaM);
  const pc = (Math.pow(combinedRadiusMeters, 2) / (2 * sigmaM * sigmaM)) * Math.exp(exponent);
  return Math.max(1e-12, Math.min(0.999, pc));
}

/**
 * Contingency "What-If" Underburn Anomaly Solver
 */
export function solveContingencyRecovery(
  initialAltKm: number,
  targetAltKm: number,
  nominalDeltaVMs: number,
  actualEfficiencyPercent: number, // e.g. 75%
  spacecraft: SpacecraftConfig
): ContingencySimulation {
  const rEarth = CELESTIAL_BODIES.earth.radius;
  const mu = CELESTIAL_BODIES.earth.mu;
  const r1 = rEarth + initialAltKm;
  const r2 = rEarth + targetAltKm;

  const actualDeltaVMs = nominalDeltaVMs * (actualEfficiencyPercent / 100);
  const v1NominalKms = Math.sqrt(mu / r1);
  const actualVPostBurnKms = v1NominalKms + actualDeltaVMs / 1000;

  // New semi-major axis from vis-viva
  const actualEnergy = Math.pow(actualVPostBurnKms, 2) / 2 - mu / r1;
  const aActual = -mu / (2 * actualEnergy);
  const actualApoapsisKm = 2 * aActual - r1 - rEarth;

  const deficitKm = Math.abs(targetAltKm - actualApoapsisKm);

  // Recovery corrective burn needed at next periapsis to regain target apoapsis
  const requiredVAtPeriapsisKms = Math.sqrt(mu * (2 / r1 - 1 / ((r1 + r2) / 2)));
  const recoveryDeltaVMs = Math.abs(requiredVAtPeriapsisKms - actualVPostBurnKms) * 1000;

  // Propellant required
  const mCurrent = spacecraft.dryMass + spacecraft.fuelMass;
  const fuelRecoveryKg = mCurrent * (1 - Math.exp(-recoveryDeltaVMs / (spacecraft.isp * 9.80665)));

  return {
    id: `contingency-${Date.now()}`,
    name: `Thruster Underburn (${actualEfficiencyPercent}% Thrust Yield)`,
    anomalyType: 'THRUSTER_UNDERBURN',
    thrustEfficiencyPercent: actualEfficiencyPercent,
    cutoffTimeSeconds: 120,
    departureTrueAnomalyDeltaDeg: 0.0,
    resultingPeriapsisKm: initialAltKm,
    resultingApoapsisKm: Math.round(actualApoapsisKm),
    dispersionDeviationKm: Math.round(deficitKm),
    recoveryFeasible: fuelRecoveryKg <= spacecraft.fuelMass,
    recoveryManeuver: {
      requiredCorrectionDeltaVMs: Math.round(recoveryDeltaVMs * 10) / 10,
      correctionBurnEpochSeconds: 5400, // At next orbit periapsis
      propellantRequiredKg: Math.round(fuelRecoveryKg * 10) / 10,
      finalRecoveredOrbitAltitudeKm: targetAltKm,
      recoveryConfidencePercent: fuelRecoveryKg <= spacecraft.fuelMass ? 96.5 : 22.0
    }
  };
}
