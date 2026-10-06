/**
 * Keplerian Orbital Calculations and Coordinate Conversions
 */
import { KeplerianElements, StateVector } from '../types/mission';
import { CELESTIAL_BODIES } from './constants';

export function solveKeplerEquation(M: number, e: number, tolerance = 1e-12, maxIter = 100): number {
  let Mnorm = M % (2 * Math.PI);
  if (Mnorm < 0) Mnorm += 2 * Math.PI;

  let E = e > 0.8 ? Math.PI : Mnorm;
  for (let iter = 0; iter < maxIter; iter++) {
    const f = E - e * Math.sin(E) - Mnorm;
    const fPrime = 1.0 - e * Math.cos(E);
    const deltaE = -f / fPrime;
    E += deltaE;
    if (Math.abs(deltaE) < tolerance) break;
  }
  return E;
}

export function trueAnomalyFromEccentric(E: number, e: number): number {
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  let nu = Math.atan2(sinNu, cosNu);
  if (nu < 0) nu += 2 * Math.PI;
  return nu;
}

export function eccentricAnomalyFromTrue(nu: number, e: number): number {
  const cosE = (e + Math.cos(nu)) / (1 + e * Math.cos(nu));
  const sinE = (Math.sqrt(1 - e * e) * Math.sin(nu)) / (1 + e * Math.cos(nu));
  let E = Math.atan2(sinE, cosE);
  if (E < 0) E += 2 * Math.PI;
  return E;
}

export function keplerianToStateVector(
  elements: KeplerianElements,
  mu = CELESTIAL_BODIES.earth.mu
): StateVector {
  const { a, e } = elements;
  const iRad = (elements.i * Math.PI) / 180;
  const raanRad = (elements.raan * Math.PI) / 180;
  const argPRad = (elements.argPeriapsis * Math.PI) / 180;
  const nuRad = (elements.trueAnomaly * Math.PI) / 180;

  const p = a * (1 - e * e);
  const rMag = p / (1 + e * Math.cos(nuRad));

  // Orbital plane position (PQW frame)
  const rPqw = [
    rMag * Math.cos(nuRad),
    rMag * Math.sin(nuRad),
    0
  ];

  // Orbital plane velocity (PQW frame)
  const sqrtMuP = Math.sqrt(mu / Math.max(1e-5, p));
  const vPqw = [
    -sqrtMuP * Math.sin(nuRad),
    sqrtMuP * (e + Math.cos(nuRad)),
    0
  ];

  // Rotation matrix from PQW to ECI (Perifocal to Inertial)
  const cosO = Math.cos(raanRad);
  const sinO = Math.sin(raanRad);
  const cosW = Math.cos(argPRad);
  const sinW = Math.sin(argPRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const Px = cosO * cosW - sinO * sinW * cosI;
  const Py = sinO * cosW + cosO * sinW * cosI;
  const Pz = sinW * sinI;

  const Qx = -cosO * sinW - sinO * cosW * cosI;
  const Qy = -sinO * sinW + cosO * cosW * cosI;
  const Qz = cosW * sinI;

  return {
    x: rPqw[0] * Px + rPqw[1] * Qx,
    y: rPqw[0] * Py + rPqw[1] * Qy,
    z: rPqw[0] * Pz + rPqw[1] * Qz,
    vx: vPqw[0] * Px + vPqw[1] * Qx,
    vy: vPqw[0] * Py + vPqw[1] * Qy,
    vz: vPqw[0] * Pz + vPqw[1] * Qz
  };
}

export function stateVectorToKeplerian(
  sv: StateVector,
  mu = CELESTIAL_BODIES.earth.mu
): KeplerianElements {
  const r = Math.sqrt(sv.x * sv.x + sv.y * sv.y + sv.z * sv.z);
  const v = Math.sqrt(sv.vx * sv.vx + sv.vy * sv.vy + sv.vz * sv.vz);

  // Angular momentum vector h = r x v
  const hx = sv.y * sv.vz - sv.z * sv.vy;
  const hy = sv.z * sv.vx - sv.x * sv.vz;
  const hz = sv.x * sv.vy - sv.y * sv.vx;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

  // Node vector n = [0, 0, 1] x h = [-hy, hx, 0]
  const nx = -hy;
  const ny = hx;
  const n = Math.sqrt(nx * nx + ny * ny);

  // Eccentricity vector e = (1/mu) * [(v^2 - mu/r)r - (r.v)v]
  const rDotV = sv.x * sv.vx + sv.y * sv.vy + sv.z * sv.vz;
  const fac1 = (v * v - mu / r) / mu;
  const fac2 = rDotV / mu;
  const ex = fac1 * sv.x - fac2 * sv.vx;
  const ey = fac1 * sv.y - fac2 * sv.vy;
  const ez = fac1 * sv.z - fac2 * sv.vz;
  const e = Math.sqrt(ex * ex + ey * ey + ez * ez);

  // Specific orbital energy
  const energy = (v * v) / 2 - mu / r;
  const a = Math.abs(energy) > 1e-10 ? -mu / (2 * energy) : 0;

  // Inclination
  const iRad = Math.acos(Math.max(-1, Math.min(1, hz / h)));

  // RAAN
  let raanRad = 0;
  if (n > 1e-10) {
    raanRad = Math.acos(Math.max(-1, Math.min(1, nx / n)));
    if (ny < 0) raanRad = 2 * Math.PI - raanRad;
  }

  // Argument of periapsis
  let argPRad = 0;
  if (n > 1e-10 && e > 1e-10) {
    const nDotE = nx * ex + ny * ey;
    argPRad = Math.acos(Math.max(-1, Math.min(1, nDotE / (n * e))));
    if (ez < 0) argPRad = 2 * Math.PI - argPRad;
  }

  // True anomaly
  let nuRad = 0;
  if (e > 1e-10) {
    const eDotR = ex * sv.x + ey * sv.y + ez * sv.z;
    nuRad = Math.acos(Math.max(-1, Math.min(1, eDotR / (e * r))));
    if (rDotV < 0) nuRad = 2 * Math.PI - nuRad;
  }

  return {
    a,
    e,
    i: (iRad * 180) / Math.PI,
    raan: (raanRad * 180) / Math.PI,
    argPeriapsis: (argPRad * 180) / Math.PI,
    trueAnomaly: (nuRad * 180) / Math.PI
  };
}

export function orbitalPeriod(a: number, mu = CELESTIAL_BODIES.earth.mu): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
}

export function visVivaVelocity(r: number, a: number, mu = CELESTIAL_BODIES.earth.mu): number {
  return Math.sqrt(Math.max(0, mu * (2 / r - 1 / a)));
}

export function specificOrbitalEnergy(a: number, mu = CELESTIAL_BODIES.earth.mu): number {
  return -mu / (2 * a);
}
