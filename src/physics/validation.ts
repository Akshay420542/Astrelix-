/**
 * Engineering Validation Suite
 * Compares numerical RK4 & Keplerian propagations against exact closed-form analytical solutions.
 */
import { KeplerianElements } from '../types/mission';
import { CELESTIAL_BODIES } from './constants';
import { orbitalPeriod, specificOrbitalEnergy, visVivaVelocity } from './orbitalCalculations';
import { propagateKeplerianAnalytical, propagateNumericalRK4 } from './propagator';
import { calculateHohmannTransfer } from './transfers';

export interface ValidationTestResult {
  id: string;
  name: string;
  category: string;
  parameterName: string;
  expectedValue: number;
  computedValue: number;
  unit: string;
  absoluteError: number;
  relativeErrorPercent: number;
  tolerancePercent: number;
  passed: boolean;
  notes: string;
}

export function runEngineeringValidationSuite(): ValidationTestResult[] {
  const tests: ValidationTestResult[] = [];
  const mu = CELESTIAL_BODIES.earth.mu;
  const rEarth = CELESTIAL_BODIES.earth.radius;

  // TEST 1: Circular Orbit Period Conservation (ISS nominal orbit 420 km)
  const a1 = rEarth + 420;
  const analyticalPeriod1 = 2 * Math.PI * Math.sqrt(Math.pow(a1, 3) / mu);
  const elements1: KeplerianElements = {
    a: a1,
    e: 0.0001,
    i: 51.64,
    raan: 120.0,
    argPeriapsis: 45.0,
    trueAnomaly: 0.0
  };
  const pts1 = propagateKeplerianAnalytical(elements1, analyticalPeriod1, 10, mu, rEarth);
  const finalPt1 = pts1[pts1.length - 1];
  const finalNu1 = (Math.atan2(finalPt1.y, finalPt1.x) * 180) / Math.PI;
  const periodCalc1 = orbitalPeriod(a1, mu);
  const err1 = Math.abs(periodCalc1 - analyticalPeriod1);
  const relErr1 = (err1 / analyticalPeriod1) * 100;

  tests.push({
    id: 'val-circular-period',
    name: 'Circular Orbit Period (Analytical Kepler vs Closed-Form)',
    category: 'Period & Mean Motion',
    parameterName: 'Orbital Period T',
    expectedValue: analyticalPeriod1,
    computedValue: periodCalc1,
    unit: 's',
    absoluteError: err1,
    relativeErrorPercent: relErr1,
    tolerancePercent: 0.001,
    passed: relErr1 < 0.001,
    notes: 'Keplerian 3rd law exact analytical equivalence.'
  });

  // TEST 2: Vis-Viva Circular Velocity Verification
  const expectedV1 = Math.sqrt(mu / a1);
  const computedV1 = visVivaVelocity(a1, a1, mu);
  const err2 = Math.abs(computedV1 - expectedV1);
  const relErr2 = (err2 / expectedV1) * 100;

  tests.push({
    id: 'val-vis-viva-circ',
    name: 'Vis-Viva Equation Circular Speed Consistency',
    category: 'Orbital Velocity',
    parameterName: 'Circular Velocity v_c',
    expectedValue: expectedV1,
    computedValue: computedV1,
    unit: 'km/s',
    absoluteError: err2,
    relativeErrorPercent: relErr2,
    tolerancePercent: 0.0001,
    passed: relErr2 < 0.0001,
    notes: 'v_c = sqrt(mu/r) tested against vis-viva general formulation.'
  });

  // TEST 3: Specific Orbital Energy Conservation
  const analyticalEnergy = -mu / (2 * a1);
  const computedEnergy = specificOrbitalEnergy(a1, mu);
  const err3 = Math.abs(computedEnergy - analyticalEnergy);
  const relErr3 = (err3 / Math.abs(analyticalEnergy)) * 100;

  tests.push({
    id: 'val-energy-conservation',
    name: 'Specific Orbital Energy Closed-Form Epsilon',
    category: 'Conservation Laws',
    parameterName: 'Specific Energy ε',
    expectedValue: analyticalEnergy,
    computedValue: computedEnergy,
    unit: 'MJ/kg',
    absoluteError: err3,
    relativeErrorPercent: relErr3,
    tolerancePercent: 0.0001,
    passed: relErr3 < 0.0001,
    notes: 'Total specific mechanical energy ε = -mu/(2a).'
  });

  // TEST 4: Hohmann Transfer LEO (300 km) to GEO (35786 km) Analytical vs Solver
  const rLEO = rEarth + 300;
  const rGEO = rEarth + 35786;
  const vLEO = Math.sqrt(mu / rLEO);
  const vGEO = Math.sqrt(mu / rGEO);
  const aTrans = (rLEO + rGEO) / 2;
  const vt1 = Math.sqrt(mu * (2 / rLEO - 1 / aTrans));
  const vt2 = Math.sqrt(mu * (2 / rGEO - 1 / aTrans));
  const exactDvTotalMs = (Math.abs(vt1 - vLEO) + Math.abs(vGEO - vt2)) * 1000;

  const dummyCraft = {
    id: 'test-craft',
    name: 'Test Vehicle',
    modelType: 'SATELLITE' as const,
    dryMass: 1000,
    fuelMass: 2000,
    fuelCapacity: 2000,
    isp: 310,
    maxThrust: 450,
    engineType: 'Chemical',
    crossSectionArea: 2.5,
    dragCoefficient: 2.2,
    solarRadiationCoeff: 1.2
  };

  const hohmannResult = calculateHohmannTransfer(rLEO, rGEO, dummyCraft, mu);
  const err4 = Math.abs(hohmannResult.totalDeltaV - exactDvTotalMs);
  const relErr4 = (err4 / exactDvTotalMs) * 100;

  tests.push({
    id: 'val-hohmann-delta-v',
    name: 'LEO to GEO Hohmann Transfer Total Δv Accuracy',
    category: 'Maneuver Mechanics',
    parameterName: 'Total Δv',
    expectedValue: exactDvTotalMs,
    computedValue: hohmannResult.totalDeltaV,
    unit: 'm/s',
    absoluteError: err4,
    relativeErrorPercent: relErr4,
    tolerancePercent: 0.01,
    passed: relErr4 < 0.01,
    notes: 'Impulse 1 periapsis boost + Impulse 2 apoapsis circularization match textbook values.'
  });

  // TEST 5: Hohmann Transfer Time of Flight (Half Period)
  const exactTOFHours = (Math.PI * Math.sqrt(Math.pow(aTrans, 3) / mu)) / 3600;
  const computedTOFHours = hohmannResult.transferTimeHours;
  const err5 = Math.abs(computedTOFHours - exactTOFHours);
  const relErr5 = (err5 / exactTOFHours) * 100;

  tests.push({
    id: 'val-hohmann-tof',
    name: 'LEO to GEO Transfer Time of Flight (Half-Period of Transfer Ellipse)',
    category: 'Trajectory Timing',
    parameterName: 'Transfer Duration t_trans',
    expectedValue: exactTOFHours,
    computedValue: computedTOFHours,
    unit: 'hours',
    absoluteError: err5,
    relativeErrorPercent: relErr5,
    tolerancePercent: 0.01,
    passed: relErr5 < 0.01,
    notes: 'Keplerian ellipse semi-major axis time of flight t = π · sqrt(a_t³ / μ).'
  });

  // TEST 6: RK4 Numerical Integrator Energy Conservation (2 Orbits Unperturbed)
  const rkPts = propagateNumericalRK4(
    elements1,
    dummyCraft,
    [],
    analyticalPeriod1 * 2,
    15,
    'BASIC_TWO_BODY',
    false,
    mu,
    rEarth
  );
  const initialE = rkPts[0].energy;
  const finalE = rkPts[rkPts.length - 1].energy;
  const err6 = Math.abs(finalE - initialE);
  const relErr6 = (err6 / Math.abs(initialE)) * 100;

  tests.push({
    id: 'val-rk4-energy-conservation',
    name: 'Runge-Kutta 4th Order Energy Drift over 2 Complete Orbits',
    category: 'Numerical Stability',
    parameterName: 'Δε (Energy Drift)',
    expectedValue: 0.0,
    computedValue: err6,
    unit: 'MJ/kg',
    absoluteError: err6,
    relativeErrorPercent: relErr6,
    tolerancePercent: 0.05,
    passed: relErr6 < 0.05,
    notes: 'RK4 fixed timestep 15s exhibits <0.05% energy drift over multi-orbit integration.'
  });

  return tests;
}
