/**
 * Preloaded Mission Presets & Demonstration Scenarios
 */
import { Mission, SpacecraftConfig } from '../types/mission';
import { CELESTIAL_BODIES } from '../physics/constants';

export const DEFAULT_SPACECRAFT: SpacecraftConfig = {
  id: 'craft-pioneer-1',
  name: 'Orbital Pioneer-1',
  modelType: 'SATELLITE',
  dryMass: 1200,
  fuelMass: 1800,
  fuelCapacity: 2000,
  isp: 320,
  maxThrust: 650,
  engineType: 'Chemical Hydrazine Bi-Propellant',
  crossSectionArea: 4.2,
  dragCoefficient: 2.2,
  solarRadiationCoeff: 1.2
};

export const PRESET_MISSIONS: Mission[] = [
  {
    id: 'mission-leo-geo',
    name: 'LEO to GEO Transfer',
    objective: 'ORBIT_TRANSFER',
    centralBody: 'earth',
    spacecraft: DEFAULT_SPACECRAFT,
    initialOrbit: {
      a: CELESTIAL_BODIES.earth.radius + 300, // 6678.14 km
      e: 0.001,
      i: 28.5,
      raan: 120.0,
      argPeriapsis: 0.0,
      trueAnomaly: 0.0
    },
    targetOrbit: {
      a: CELESTIAL_BODIES.earth.radius + 35786, // 42164.14 km
      e: 0.0001,
      i: 0.0,
      raan: 0.0,
      argPeriapsis: 0.0,
      trueAnomaly: 180.0
    },
    maneuvers: [
      {
        id: 'burn-1',
        name: 'Trans-GEO Injection (Burn 1 - Periapsis)',
        type: 'PROGRADE',
        deltaV: 2426.5,
        vector: [2426.5, 0, 0],
        trueAnomalyAtBurn: 0.0,
        burnEpochSeconds: 600,
        burnDurationSeconds: 120,
        fuelConsumedKg: 780,
        enabled: true
      },
      {
        id: 'burn-2',
        name: 'Apogee Circularization & Plane Change (Burn 2)',
        type: 'PROGRADE',
        deltaV: 1478.2,
        vector: [1478.2, 0, 0],
        trueAnomalyAtBurn: 180.0,
        burnEpochSeconds: 19600,
        burnDurationSeconds: 95,
        fuelConsumedKg: 420,
        enabled: true
      }
    ],
    fidelity: 'ADVANCED_J2_DRAG',
    epochUtc: '2026-10-06T00:00:00Z'
  },
  {
    id: 'mission-iss-tracking',
    name: 'ISS Tracking & Phasing',
    objective: 'STATION_KEEPING',
    centralBody: 'earth',
    spacecraft: {
      id: 'craft-iss',
      name: 'ISS (Zarya)',
      modelType: 'STATION',
      dryMass: 420000,
      fuelMass: 4000,
      fuelCapacity: 5000,
      isp: 300,
      maxThrust: 2940,
      engineType: 'Progress Reboost Thrusters',
      crossSectionArea: 1600.0,
      dragCoefficient: 2.2,
      solarRadiationCoeff: 1.0
    },
    initialOrbit: {
      a: 6798.14,
      e: 0.0005128,
      i: 51.6424,
      raan: 163.4812,
      argPeriapsis: 114.2819,
      trueAnomaly: 245.8912
    },
    targetOrbit: {
      a: 6800.0,
      e: 0.0004,
      i: 51.64,
      raan: 163.5,
      argPeriapsis: 114.0,
      trueAnomaly: 250.0
    },
    maneuvers: [
      {
        id: 'iss-reboost',
        name: 'Altitude Maintenance Reboost',
        type: 'PROGRADE',
        deltaV: 2.1,
        vector: [2.1, 0, 0],
        trueAnomalyAtBurn: 0.0,
        burnEpochSeconds: 2700,
        burnDurationSeconds: 180,
        fuelConsumedKg: 310,
        enabled: true
      }
    ],
    fidelity: 'ADVANCED_J2_DRAG',
    epochUtc: '2026-10-05T19:30:00Z'
  },
  {
    id: 'mission-earth-moon',
    name: 'Earth to Moon Trans-Lunar Injection',
    objective: 'LUNAR_INJECTION',
    centralBody: 'earth',
    spacecraft: {
      id: 'craft-artemis',
      name: 'Lunar Explorer Vehicle',
      modelType: 'PROBE',
      dryMass: 2400,
      fuelMass: 3600,
      fuelCapacity: 4000,
      isp: 325,
      maxThrust: 980,
      engineType: 'Staged Bipropellant',
      crossSectionArea: 6.5,
      dragCoefficient: 2.1,
      solarRadiationCoeff: 1.3
    },
    initialOrbit: {
      a: 6563.0,
      e: 0.005,
      i: 28.5,
      raan: 45.0,
      argPeriapsis: 30.0,
      trueAnomaly: 0.0
    },
    targetOrbit: {
      a: 200000.0,
      e: 0.965,
      i: 28.5,
      raan: 45.0,
      argPeriapsis: 30.0,
      trueAnomaly: 180.0
    },
    maneuvers: [
      {
        id: 'tli-burn',
        name: 'Trans-Lunar Injection (TLI)',
        type: 'PROGRADE',
        deltaV: 3120.0,
        vector: [3120.0, 0, 0],
        trueAnomalyAtBurn: 0.0,
        burnEpochSeconds: 1200,
        burnDurationSeconds: 340,
        fuelConsumedKg: 2150,
        enabled: true
      }
    ],
    fidelity: 'HIGH_FIDELITY_NBODY',
    epochUtc: '2026-10-06T12:00:00Z'
  }
];
