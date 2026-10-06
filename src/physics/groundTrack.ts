/**
 * Ground Track & Satellite Visibility / Pass Prediction
 */
import { GroundStation, SatellitePass, TrajectoryPoint } from '../types/mission';
import { CELESTIAL_BODIES } from './constants';

export function calculateSubSatellitePoint(
  xKm: number,
  yKm: number,
  zKm: number,
  timeSec: number,
  radius = CELESTIAL_BODIES.earth.radius
): { lat: number; lon: number; altitude: number } {
  const rMag = Math.sqrt(xKm * xKm + yKm * yKm + zKm * zKm);
  const altitude = rMag - radius;

  // Geodetic latitude approximation
  const lat = (Math.asin(Math.max(-1, Math.min(1, zKm / rMag))) * 180) / Math.PI;

  // Greenwich Mean Sidereal Time (GMST) rotation
  const earthRotRateDegPerSec = 360 / 86164.0905;
  const greenwichHourAngleDeg = (timeSec * earthRotRateDegPerSec) % 360;
  const lonRaw = (Math.atan2(yKm, xKm) * 180) / Math.PI - greenwichHourAngleDeg;
  const lon = ((lonRaw + 180) % 360 + 360) % 360 - 180;

  return { lat, lon, altitude };
}

export function calculateVisibilityFootprintRadius(
  altitudeKm: number,
  minElevationDeg = 5.0,
  radius = CELESTIAL_BODIES.earth.radius
): number {
  // Angular radius theta of ground visibility cone
  const elevRad = (minElevationDeg * Math.PI) / 180;
  const rTotal = radius + altitudeKm;
  const cosEta = (radius / rTotal) * Math.cos(elevRad);
  const eta = Math.acos(Math.max(0, Math.min(1, cosEta)));
  const lambda = Math.PI / 2 - elevRad - eta; // Earth central angle in radians
  return lambda * radius; // Arc distance on Earth surface in km
}

export function predictPasses(
  trajectory: TrajectoryPoint[],
  station: GroundStation,
  minElevationDeg = 5.0,
  radius = CELESTIAL_BODIES.earth.radius
): SatellitePass[] {
  const passes: SatellitePass[] = [];
  let inPass = false;
  let passStartTime = 0;
  let maxElev = 0;

  const stLatRad = (station.latitude * Math.PI) / 180;
  const stLonRad = (station.longitude * Math.PI) / 180;

  for (let i = 0; i < trajectory.length; i++) {
    const pt = trajectory[i];
    const subLatRad = (pt.lat * Math.PI) / 180;
    const subLonRad = (pt.lon * Math.PI) / 180;

    // Great circle angular distance sigma
    const sinDLat2 = Math.sin((subLatRad - stLatRad) / 2);
    const sinDLon2 = Math.sin((subLonRad - stLonRad) / 2);
    const a =
      sinDLat2 * sinDLat2 +
      Math.cos(stLatRad) * Math.cos(subLatRad) * sinDLon2 * sinDLon2;
    const sigma = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

    // Slant range to satellite
    const rSat = radius + pt.altitude;
    const slantDist = Math.sqrt(radius * radius + rSat * rSat - 2 * radius * rSat * Math.cos(sigma));

    // Elevation angle
    let elevationDeg = -90;
    if (slantDist > 1e-4) {
      const cosElev = (rSat * Math.sin(sigma)) / slantDist;
      const sinElev = (rSat * Math.cos(sigma) - radius) / slantDist;
      elevationDeg = (Math.atan2(sinElev, cosElev) * 180) / Math.PI;
    }

    if (elevationDeg >= minElevationDeg) {
      if (!inPass) {
        inPass = true;
        passStartTime = pt.timeSec;
        maxElev = elevationDeg;
      } else {
        if (elevationDeg > maxElev) maxElev = elevationDeg;
      }
    } else {
      if (inPass) {
        inPass = false;
        const durationMin = (pt.timeSec - passStartTime) / 60;
        if (durationMin > 0.5) {
          const aosDate = new Date(Date.now() + passStartTime * 1000).toISOString().substring(11, 19) + ' UTC';
          const losDate = new Date(Date.now() + pt.timeSec * 1000).toISOString().substring(11, 19) + ' UTC';
          passes.push({
            id: `pass-${station.code}-${passes.length + 1}`,
            stationName: station.name,
            satelliteName: 'Active Track',
            aosUtc: aosDate,
            losUtc: losDate,
            maxElevationDeg: Math.round(maxElev * 10) / 10,
            durationMinutes: Math.round(durationMin * 10) / 10
          });
        }
      }
    }
  }

  return passes;
}
