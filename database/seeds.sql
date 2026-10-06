-- =====================================================================
-- SEED DATA FOR ORBITAL MISSION PLANNER
-- =====================================================================

-- Orbital Bodies
INSERT INTO orbital_bodies (id, name, mu_km3_s2, radius_km, mass_kg, j2_coefficient, rotation_period_hours, color_hex) VALUES
('body-earth', 'Earth', 398600.4418, 6378.137, 5.9722e24, 0.00108263, 23.93447, '#38bdf8'),
('body-moon', 'Moon', 4902.8000, 1737.400, 7.3420e22, 0.00020270, 655.72800, '#cbd5e1'),
('body-sun', 'Sun', 132712440018.0, 696340.0, 1.9890e30, 0.00000020, 609.12000, '#facc15'),
('body-mars', 'Mars', 42828.3752, 3389.500, 6.4171e23, 0.00196045, 24.62296, '#f87171'),
('body-jupiter', 'Jupiter', 126686534.0, 69911.0, 1.8982e27, 0.01473600, 9.92500, '#fbbf24')
ON CONFLICT (id) DO NOTHING;

-- Ground Stations
INSERT INTO ground_stations (id, name, code, latitude_deg, longitude_deg, altitude_m, min_elevation_deg) VALUES
('gs-ksc', 'Kennedy Space Center', 'KSC', 28.5729, -80.6490, 3.0, 5.0),
('gs-jsc', 'Johnson Space Center', 'JSC', 29.5593, -95.0900, 6.0, 5.0),
('gs-csg', 'Guiana Space Centre', 'CSG', 5.2372, -52.7683, 15.0, 5.0),
('gs-sva', 'Svalbard Satellite Station', 'SGS', 78.2298, 15.4078, 474.0, 3.0),
('gs-gds', 'Goldstone Deep Space Comm', 'GDS', 35.4267, -116.8900, 1036.0, 10.0),
('gs-mad', 'Madrid Deep Space Comm', 'MDS', 40.4314, -4.2480, 834.0, 10.0),
('gs-cds', 'Canberra Deep Space Comm', 'CDS', -35.4014, 148.9817, 680.0, 10.0),
('gs-bai', 'Baikonur Cosmodrome', 'BAI', 45.9646, 63.3052, 100.0, 5.0)
ON CONFLICT (id) DO NOTHING;
