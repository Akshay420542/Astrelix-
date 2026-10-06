/**
 * Trajectory Propagator (Keplerian & Numerical RK4 with J2 and Atmospheric Drag)
 */
import {
  KeplerianElements,
  ManeuverNode,
  PhysicsFidelity,
  SpacecraftConfig,
  TrajectoryPoint
} from '../types/mission';
import { CELESTIAL_BODIES } from './constants';
import { calculateJacchiaBowmanDensity } from './jacchiaBowman';
import {
  keplerianToStateVector,
  solveKeplerEquation,
  stateVectorToKeplerian,
  trueAnomalyFromEccentric
} from './orbitalCalculations';

export function propagateKeplerianAnalytical(
  initialElements: KeplerianElements,
  durationSec: number,
  stepSec: number,
  mu = CELESTIAL_BODIES.earth.mu,
  radius = CELESTIAL_BODIES.earth.radius
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const { a, e } = initialElements;
  const n = Math.sqrt(mu / Math.pow(a, 3)); // Mean motion rad/s

  // Initial mean anomaly from true anomaly
  const nu0Rad = (initialElements.trueAnomaly * Math.PI) / 180;
  const sinE0 = (Math.sqrt(1 - e * e) * Math.sin(nu0Rad)) / (1 + e * Math.cos(nu0Rad));
  const cosE0 = (e + Math.cos(nu0Rad)) / (1 + e * Math.cos(nu0Rad));
  const E0 = Math.atan2(sinE0, cosE0);
  const M0 = E0 - e * Math.sin(E0);

  const steps = Math.min(1000, Math.max(10, Math.floor(durationSec / stepSec)));
  const dt = durationSec / steps;

  for (let s = 0; s <= steps; s++) {
    const t = s * dt;
    const Mt = M0 + n * t;
    const Et = solveKeplerEquation(Mt, e);
    const nut = trueAnomalyFromEccentric(Et, e);

    const osculating: KeplerianElements = {
      ...initialElements,
      trueAnomaly: (nut * 180) / Math.PI
    };

    const sv = keplerianToStateVector(osculating, mu);
    const rMag = Math.sqrt(sv.x * sv.x + sv.y * sv.y + sv.z * sv.z);
    const vMag = Math.sqrt(sv.vx * sv.vx + sv.vy * sv.vy + sv.vz * sv.vz);
    const alt = rMag - radius;

    // Approximate geodetic coordinates with Earth rotation
    const lat = (Math.asin(Math.max(-1, Math.min(1, sv.z / rMag))) * 180) / Math.PI;
    const earthRotDeg = (t * 360) / 86164.09;
    const lonRaw = (Math.atan2(sv.y, sv.x) * 180) / Math.PI - earthRotDeg;
    const lon = ((lonRaw + 180) % 360 + 360) % 360 - 180;

    const energy = (vMag * vMag) / 2 - mu / rMag;

    points.push({
      timeSec: t,
      x: sv.x,
      y: sv.y,
      z: sv.z,
      vx: sv.vx,
      vy: sv.vy,
      vz: sv.vz,
      altitude: alt,
      speed: vMag,
      lat,
      lon,
      energy
    });
  }

  return points;
}

export function propagateNumericalRK4(
  initialElements: KeplerianElements,
  spacecraft: SpacecraftConfig,
  maneuvers: ManeuverNode[],
  durationSec: number,
  stepSec: number,
  fidelity: PhysicsFidelity = 'ADVANCED_J2_DRAG',
  enableAtmosphericDrag = true,
  mu = CELESTIAL_BODIES.earth.mu,
  radius = CELESTIAL_BODIES.earth.radius,
  j2 = CELESTIAL_BODIES.earth.j2
): TrajectoryPoint[] {
  let state = keplerianToStateVector(initialElements, mu);
  const points: TrajectoryPoint[] = [];

  const steps = Math.min(1200, Math.max(20, Math.floor(durationSec / stepSec)));
  const dt = durationSec / steps;

  // Clone maneuvers sorted by burn time
  const activeManeuvers = [...maneuvers]
    .filter((m) => m.enabled)
    .sort((a, b) => a.burnEpochSeconds - b.burnEpochSeconds);

  let currentFuel = spacecraft.fuelMass;

  function acceleration(
    r: [number, number, number],
    v: [number, number, number],
    mass: number
  ): [number, number, number] {
    const rMag = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]);
    if (rMag < 1e-4) return [0, 0, 0];

    // 1. Two-body Newtonian gravity
    const factorNewton = -mu / Math.pow(rMag, 3);
    let ax = factorNewton * r[0];
    let ay = factorNewton * r[1];
    let az = factorNewton * r[2];

    // 2. Earth J2 oblateness perturbation
    if (fidelity !== 'BASIC_TWO_BODY') {
      const z2r2 = (r[2] / rMag) * (r[2] / rMag);
      const factorJ2 = (-1.5 * j2 * mu * radius * radius) / Math.pow(rMag, 5);
      ax += factorJ2 * r[0] * (1 - 5 * z2r2);
      ay += factorJ2 * r[1] * (1 - 5 * z2r2);
      az += factorJ2 * r[2] * (3 - 5 * z2r2);
    }

    // 3. Atmospheric drag (Jacchia-Bowman thermospheric model)
    const alt = rMag - radius;
    if (enableAtmosphericDrag && fidelity === 'ADVANCED_J2_DRAG' && alt > 0 && alt < 900) {
      // High-accuracy Jacchia-Bowman thermospheric neutral density (kg/m^3)
      const rho = calculateJacchiaBowmanDensity(alt, 150.0, 12.0);

      const vMagKms = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      if (vMagKms > 1e-5) {
        const vMs = vMagKms * 1000;
        const dragForceN = 0.5 * rho * vMs * vMs * spacecraft.dragCoefficient * spacecraft.crossSectionArea;
        const dragAccKms2 = (dragForceN / mass) / 1000;
        ax -= dragAccKms2 * (v[0] / vMagKms);
        ay -= dragAccKms2 * (v[1] / vMagKms);
        az -= dragAccKms2 * (v[2] / vMagKms);
      }
    }

    return [ax, ay, az];
  }

  for (let s = 0; s <= steps; s++) {
    const t = s * dt;
    const rMag = Math.sqrt(state.x * state.x + state.y * state.y + state.z * state.z);
    const vMag = Math.sqrt(state.vx * state.vx + state.vy * state.vy + state.vz * state.vz);
    const alt = rMag - radius;

    const lat = (Math.asin(Math.max(-1, Math.min(1, state.z / rMag))) * 180) / Math.PI;
    const earthRotDeg = (t * 360) / 86164.09;
    const lonRaw = (Math.atan2(state.y, state.x) * 180) / Math.PI - earthRotDeg;
    const lon = ((lonRaw + 180) % 360 + 360) % 360 - 180;
    const energy = (vMag * vMag) / 2 - mu / rMag;

    // Check if any maneuver fires at this timestep
    let isManeuverPoint = false;
    for (const man of activeManeuvers) {
      if (Math.abs(man.burnEpochSeconds - t) < dt / 2) {
        isManeuverPoint = true;
        // Apply impulsive delta-v in Prograde direction (or specified vector)
        const vUnit: [number, number, number] = [
          state.vx / vMag,
          state.vy / vMag,
          state.vz / vMag
        ];

        // Normal unit: r x v
        const hx = state.y * state.vz - state.z * state.vy;
        const hy = state.z * state.vx - state.x * state.vz;
        const hz = state.x * state.vy - state.y * state.vx;
        const hMag = Math.sqrt(hx * hx + hy * hy + hz * hz);
        const nUnit: [number, number, number] = [hx / hMag, hy / hMag, hz / hMag];

        // Radial unit: n x v
        const rx = nUnit[1] * vUnit[2] - nUnit[2] * vUnit[1];
        const ry = nUnit[2] * vUnit[0] - nUnit[0] * vUnit[2];
        const rz = nUnit[0] * vUnit[1] - nUnit[1] * vUnit[0];

        const dvKms = man.deltaV / 1000;
        let dvVec: [number, number, number] = [0, 0, 0];

        switch (man.type) {
          case 'PROGRADE':
            dvVec = [vUnit[0] * dvKms, vUnit[1] * dvKms, vUnit[2] * dvKms];
            break;
          case 'RETROGRADE':
            dvVec = [-vUnit[0] * dvKms, -vUnit[1] * dvKms, -vUnit[2] * dvKms];
            break;
          case 'NORMAL':
            dvVec = [nUnit[0] * dvKms, nUnit[1] * dvKms, nUnit[2] * dvKms];
            break;
          case 'ANTI_NORMAL':
            dvVec = [-nUnit[0] * dvKms, -nUnit[1] * dvKms, -nUnit[2] * dvKms];
            break;
          case 'RADIAL_IN':
            dvVec = [-rx * dvKms, -ry * dvKms, -rz * dvKms];
            break;
          case 'RADIAL_OUT':
            dvVec = [rx * dvKms, ry * dvKms, rz * dvKms];
            break;
          default:
            dvVec = [vUnit[0] * dvKms, vUnit[1] * dvKms, vUnit[2] * dvKms];
        }

        state.vx += dvVec[0];
        state.vy += dvVec[1];
        state.vz += dvVec[2];

        // Consume fuel: Tsiolkovsky
        const currentTotalMass = spacecraft.dryMass + currentFuel;
        const fuelBurned = currentTotalMass * (1 - Math.exp(-Math.abs(man.deltaV) / (spacecraft.isp * 9.80665)));
        currentFuel = Math.max(0, currentFuel - fuelBurned);
      }
    }

    points.push({
      timeSec: t,
      x: state.x,
      y: state.y,
      z: state.z,
      vx: state.vx,
      vy: state.vy,
      vz: state.vz,
      altitude: alt,
      speed: vMag,
      lat,
      lon,
      energy,
      isManeuverPoint
    });

    // RK4 integration step
    const currentMass = spacecraft.dryMass + currentFuel;
    const r: [number, number, number] = [state.x, state.y, state.z];
    const v: [number, number, number] = [state.vx, state.vy, state.vz];

    const k1v = acceleration(r, v, currentMass);
    const k1r = v;

    const r2: [number, number, number] = [
      r[0] + 0.5 * dt * k1r[0],
      r[1] + 0.5 * dt * k1r[1],
      r[2] + 0.5 * dt * k1r[2]
    ];
    const v2: [number, number, number] = [
      v[0] + 0.5 * dt * k1v[0],
      v[1] + 0.5 * dt * k1v[1],
      v[2] + 0.5 * dt * k1v[2]
    ];
    const k2v = acceleration(r2, v2, currentMass);
    const k2r = v2;

    const r3: [number, number, number] = [
      r[0] + 0.5 * dt * k2r[0],
      r[1] + 0.5 * dt * k2r[1],
      r[2] + 0.5 * dt * k2r[2]
    ];
    const v3: [number, number, number] = [
      v[0] + 0.5 * dt * k2v[0],
      v[1] + 0.5 * dt * k2v[1],
      v[2] + 0.5 * dt * k2v[2]
    ];
    const k3v = acceleration(r3, v3, currentMass);
    const k3r = v3;

    const r4: [number, number, number] = [
      r[0] + dt * k3r[0],
      r[1] + dt * k3r[1],
      r[2] + dt * k3r[2]
    ];
    const v4: [number, number, number] = [
      v[0] + dt * k3v[0],
      v[1] + dt * k3v[1],
      v[2] + dt * k3v[2]
    ];
    const k4v = acceleration(r4, v4, currentMass);
    const k4r = v4;

    state = {
      x: r[0] + (dt / 6) * (k1r[0] + 2 * k2r[0] + 2 * k3r[0] + k4r[0]),
      y: r[1] + (dt / 6) * (k1r[1] + 2 * k2r[1] + 2 * k3r[1] + k4r[1]),
      z: r[2] + (dt / 6) * (k1r[2] + 2 * k2r[2] + 2 * k3r[2] + k4r[2]),
      vx: v[0] + (dt / 6) * (k1v[0] + 2 * k2v[0] + 2 * k3v[0] + k4v[0]),
      vy: v[1] + (dt / 6) * (k1v[1] + 2 * k2v[1] + 2 * k3v[1] + k4v[1]),
      vz: v[2] + (dt / 6) * (k1v[2] + 2 * k2v[2] + 2 * k3v[2] + k4v[2])
    };
  }

  return points;
}
