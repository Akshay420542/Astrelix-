/**
 * Orbital Mission Planner Core Types & Interfaces
 */

export type CelestialBodyId = 'earth' | 'moon' | 'sun' | 'mars' | 'jupiter';

export interface CelestialBody {
  id: CelestialBodyId;
  name: string;
  mu: number; // km^3 / s^2
  radius: number; // km
  mass: number; // kg
  j2: number;
  rotationPeriodHours: number;
  color: string;
  textureType: string;
  orbitalRadiusAU?: number;
  orbitalPeriodDays?: number;
}

export interface KeplerianElements {
  a: number; // Semi-major axis in km
  e: number; // Eccentricity
  i: number; // Inclination in degrees
  raan: number; // Right Ascension of Ascending Node in degrees
  argPeriapsis: number; // Argument of Periapsis in degrees
  trueAnomaly: number; // True Anomaly in degrees
  epoch?: string;
}

export interface StateVector {
  x: number; // km
  y: number; // km
  z: number; // km
  vx: number; // km/s
  vy: number; // km/s
  vz: number; // km/s
}

export interface SpacecraftConfig {
  id: string;
  name: string;
  modelType: 'CUBESAT' | 'SATELLITE' | 'STATION' | 'PROBE' | 'OBSERVATORY';
  dryMass: number; // kg
  fuelMass: number; // kg
  fuelCapacity: number; // kg
  isp: number; // seconds
  maxThrust: number; // Newtons
  engineType: string;
  crossSectionArea: number; // m^2
  dragCoefficient: number; // Cd
  solarRadiationCoeff: number; // Cr
}

export type ManeuverType = 'PROGRADE' | 'RETROGRADE' | 'NORMAL' | 'ANTI_NORMAL' | 'RADIAL_IN' | 'RADIAL_OUT' | 'CUSTOM';

export interface ManeuverNode {
  id: string;
  name: string;
  type: ManeuverType;
  deltaV: number; // m/s
  vector: [number, number, number]; // [prograde, normal, radial] or ECI in m/s
  trueAnomalyAtBurn: number; // deg
  burnEpochSeconds: number; // seconds from mission start
  burnDurationSeconds: number; // s
  fuelConsumedKg: number; // kg
  enabled: boolean;
}

export type PhysicsFidelity = 'BASIC_TWO_BODY' | 'ADVANCED_J2_DRAG' | 'HIGH_FIDELITY_NBODY';

export type MissionObjective =
  | 'ORBIT_TRANSFER'
  | 'STATION_KEEPING'
  | 'RENDEZVOUS'
  | 'LUNAR_INJECTION'
  | 'INTERPLANETARY'
  | 'EARTH_OBSERVATION'
  | 'DEORBIT';

export interface Mission {
  id: string;
  name: string;
  objective: MissionObjective;
  centralBody: CelestialBodyId;
  spacecraft: SpacecraftConfig;
  initialOrbit: KeplerianElements;
  targetOrbit?: KeplerianElements;
  maneuvers: ManeuverNode[];
  fidelity: PhysicsFidelity;
  enableAtmosphericDrag?: boolean;
  epochUtc: string;
  simulatedTrajectory?: TrajectoryPoint[];
  transferCalculation?: TransferResult;
}

export interface TrajectoryPoint {
  timeSec: number;
  x: number; // km
  y: number; // km
  z: number; // km
  vx: number; // km/s
  vy: number; // km/s
  vz: number; // km/s
  altitude: number; // km
  speed: number; // km/s
  lat: number; // deg
  lon: number; // deg
  energy: number; // MJ/kg
  isManeuverPoint?: boolean;
}

export interface TransferResult {
  type: 'HOHMANN' | 'BI_ELLIPTIC' | 'PLANE_CHANGE';
  r1: number; // km
  r2: number; // km
  semiMajorAxisTransfer: number; // km
  deltaV1: number; // m/s
  deltaV2: number; // m/s
  totalDeltaV: number; // m/s
  transferTimeSec: number; // s
  transferTimeHours: number; // hours
  fuelConsumedKg: number;
  isFeasible: boolean;
}

export interface SatelliteRecord {
  id: string;
  noradId: number;
  name: string;
  intlDesignator: string;
  category: 'CREWED' | 'EARTH_OBSERVATION' | 'NAVIGATION' | 'COMMUNICATION' | 'WEATHER' | 'SCIENTIFIC' | 'DEBRIS';
  country: string;
  tleLine1: string;
  tleLine2: string;
  elements: KeplerianElements;
  altitudeKm: number;
  speedKms: number;
  periodMinutes: number;
  dataSource: string;
  lastUpdatedUtc: string;
  dataStatus: 'LIVE' | 'RECENT' | 'CACHED' | 'DEMO';
  propagationMethod: 'SGP4' | 'KEPLERIAN_TWO_BODY';
}

export interface GroundStation {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  minElevationDeg: number;
}

export interface SatellitePass {
  id: string;
  stationName: string;
  satelliteName: string;
  aosUtc: string;
  losUtc: string;
  maxElevationDeg: number;
  durationMinutes: number;
}

export interface ScenarioComparison {
  id: string;
  name: string;
  spacecraftName: string;
  engineIsp: number;
  thrustN: number;
  totalDeltaV: number; // m/s
  fuelUsedKg: number;
  transferTimeHours: number;
  finalAltitudeKm: number;
  maneuverCount: number;
}
