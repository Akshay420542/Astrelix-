/**
 * Advanced Astrodynamics, SDA, Link Budget, Multi-Agency & Contingency Types
 */

// 1. Digital Thread & Multi-Agency Workspace
export type SpaceAgency = 'NASA' | 'ESA' | 'JAXA' | 'ISRO' | 'USSF' | 'COMMERCIAL_NEWSPACE';

export interface DigitalThreadItem {
  id: string;
  timestampUtc: string;
  agency: SpaceAgency;
  operator: string;
  category: 'PROPULSION_REVISION' | 'TRAJECTORY_BASELINE' | 'CAD_GEOMETRY' | 'SAFETY_SIGNOFF' | 'CAM_AUTHORIZED';
  title: string;
  hash: string; // SHA-256 digital fingerprint
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  details: string;
}

// 2. Space Domain Awareness (SDA) & Conjunction Risk Assessment
export interface ConjunctionEvent {
  id: string;
  targetSatellite: string;
  chaserDebrisName: string;
  noradIdDebris: number;
  debrisType: 'PAYLOAD' | 'ROCKET_BODY' | 'FRAGMENTATION_DEBRIS';
  tcaUtc: string; // Time of Closest Approach
  timeToTcaSeconds: number;
  missDistanceTotalKm: number;
  radialMissKm: number;
  inTrackMissKm: number;
  crossTrackMissKm: number;
  relativeVelocityKms: number;
  collisionProbabilityPc: number; // e.g. 4.2e-4
  riskLevel: 'CRITICAL' | 'WARNING' | 'EVALUATION' | 'NOMINAL';
  recommendedCamDeltaV?: {
    burnType: 'PROGRADE' | 'RADIAL_OUT' | 'NORMAL';
    deltaVMs: number;
    burnTimeSecondsBeforeTca: number;
    postManeuverMissKm: number;
    postManeuverPc: number;
  };
}

// 3. High-Fidelity Multi-Body & Non-Keplerian Propagators
export interface MultiBodyConfig {
  gravityModel: 'POINT_MASS_TWO_BODY' | 'J2_J3_J4_ZONAL' | 'EGM96_FULL_SPHERICAL_HARMONICS';
  j2Enabled: boolean;
  j3Enabled: boolean;
  j4Enabled: boolean;
  includeLunarThirdBody: boolean;
  includeSolarThirdBody: boolean;
  includeSolarRadiationPressure: boolean;
  srpReflectivityCoeff: number; // Cr (1.0 - 2.0)
  includeAtmosphericDrag: boolean;
  dragAtmosphereModel: 'EXPONENTIAL_STANDARD' | 'NRLMSISE_00_EMPIRICAL';
  integratorEngine: 'RUNGE_KUTTA_4' | 'RUNGE_KUTTA_FEHLBERG_78' | 'OREKIT_DORMAND_PRINCE_853';
  toleranceError: number;
}

// 4. Ground Station Link-Budget & RF Telemetry
export type RfFrequencyBand = 'S_BAND' | 'X_BAND' | 'KA_BAND' | 'OPTICAL_LASER';

export interface LinkBudgetCalculation {
  frequencyBand: RfFrequencyBand;
  frequencyGhz: number;
  groundStationCode: string;
  distanceKm: number;
  elevationDeg: number;
  transmitterPowerWatts: number;
  spacecraftAntennaGainDbi: number;
  eirpDbw: number; // Equivalent Isotropically Radiated Power
  freeSpacePathLossDb: number;
  atmosphericAttenuationDb: number;
  groundStationGTDbK: number; // G/T figure of merit
  dataRateMbps: number;
  receivedCarrierToNoiseDbHz: number; // C/N0
  energyPerBitToNoiseDb: number; // Eb/N0
  requiredEbN0Db: number;
  linkMarginDb: number;
  linkStatus: 'CLOSED_NOMINAL' | 'DEGRADED_MARGIN' | 'LINK_DOWN';
}

// 5. "What-If" Contingency & Constraint Solver
export interface ContingencySimulation {
  id: string;
  name: string;
  anomalyType: 'THRUSTER_UNDERBURN' | 'PREMATURE_CUTOFF' | 'DELAYED_BURN_EPOCH' | 'ATTITUDE_SLEW_BIAS';
  thrustEfficiencyPercent: number; // e.g. 75% for 25% underburn
  cutoffTimeSeconds: number; // premature shutdown epoch
  departureTrueAnomalyDeltaDeg: number;
  resultingPeriapsisKm: number;
  resultingApoapsisKm: number;
  dispersionDeviationKm: number;
  recoveryFeasible: boolean;
  recoveryManeuver?: {
    requiredCorrectionDeltaVMs: number;
    correctionBurnEpochSeconds: number;
    propellantRequiredKg: number;
    finalRecoveredOrbitAltitudeKm: number;
    recoveryConfidencePercent: number;
  };
}
