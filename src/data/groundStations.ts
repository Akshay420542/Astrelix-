/**
 * Global Ground Station Network
 */
import { GroundStation } from '../types/mission';

export const GROUND_STATIONS: GroundStation[] = [
  {
    id: 'gs-ksc',
    name: 'Kennedy Space Center',
    code: 'KSC',
    latitude: 28.5729,
    longitude: -80.649,
    altitudeMeters: 3.0,
    minElevationDeg: 5.0
  },
  {
    id: 'gs-jsc',
    name: 'Johnson Space Center',
    code: 'JSC',
    latitude: 29.5593,
    longitude: -95.09,
    altitudeMeters: 6.0,
    minElevationDeg: 5.0
  },
  {
    id: 'gs-csg',
    name: 'Guiana Space Centre',
    code: 'CSG',
    latitude: 5.2372,
    longitude: -52.7683,
    altitudeMeters: 15.0,
    minElevationDeg: 5.0
  },
  {
    id: 'gs-sva',
    name: 'Svalbard Satellite Station',
    code: 'SGS',
    latitude: 78.2298,
    longitude: 15.4078,
    altitudeMeters: 474.0,
    minElevationDeg: 3.0
  },
  {
    id: 'gs-gds',
    name: 'Goldstone Deep Space Comm',
    code: 'GDS',
    latitude: 35.4267,
    longitude: -116.89,
    altitudeMeters: 1036.0,
    minElevationDeg: 10.0
  },
  {
    id: 'gs-mad',
    name: 'Madrid Deep Space Comm',
    code: 'MDS',
    latitude: 40.4314,
    longitude: -4.248,
    altitudeMeters: 834.0,
    minElevationDeg: 10.0
  },
  {
    id: 'gs-cds',
    name: 'Canberra Deep Space Comm',
    code: 'CDS',
    latitude: -35.4014,
    longitude: 148.9817,
    altitudeMeters: 680.0,
    minElevationDeg: 10.0
  },
  {
    id: 'gs-bai',
    name: 'Baikonur Cosmodrome',
    code: 'BAI',
    latitude: 45.9646,
    longitude: 63.3052,
    altitudeMeters: 100.0,
    minElevationDeg: 5.0
  }
];
