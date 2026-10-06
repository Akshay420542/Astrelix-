/**
 * Astrodynamic Constants and Celestial Bodies
 */
import { CelestialBody } from '../types/mission';

export const G = 6.67430e-11; // m^3 kg^-1 s^-2
export const G0 = 9.80665; // m/s^2 standard earth gravity

export const CELESTIAL_BODIES: Record<string, CelestialBody> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    mu: 398600.4418, // km^3 / s^2
    radius: 6378.137, // km
    mass: 5.9722e24, // kg
    j2: 1.08263e-3,
    rotationPeriodHours: 23.9344696,
    color: '#38bdf8',
    textureType: 'earth'
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    mu: 4902.8000,
    radius: 1737.4,
    mass: 7.342e22,
    j2: 0.0002027,
    rotationPeriodHours: 655.728,
    color: '#cbd5e1',
    textureType: 'moon',
    orbitalRadiusAU: 384400, // km from Earth
    orbitalPeriodDays: 27.32166
  },
  sun: {
    id: 'sun',
    name: 'Sun',
    mu: 132712440018.0,
    radius: 696340.0,
    mass: 1.989e30,
    j2: 2.0e-7,
    rotationPeriodHours: 609.12,
    color: '#facc15',
    textureType: 'sun'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    mu: 42828.3752,
    radius: 3389.5,
    mass: 6.4171e23,
    j2: 1.96045e-3,
    rotationPeriodHours: 24.62296,
    color: '#f87171',
    textureType: 'mars'
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    mu: 126686534.0,
    radius: 69911.0,
    mass: 1.8982e27,
    j2: 1.4736e-2,
    rotationPeriodHours: 9.925,
    color: '#fbbf24',
    textureType: 'jupiter'
  }
};
