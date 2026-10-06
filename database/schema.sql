-- =====================================================================
-- PHYSICS-ACCURATE ORBITAL MISSION PLANNER - DATABASE SCHEMA
-- PostgreSQL (Production) / SQLite (Local Embedded)
-- =====================================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Celestial Bodies (Earth, Moon, Sun, Mars, etc.)
CREATE TABLE IF NOT EXISTS orbital_bodies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    mu_km3_s2 DOUBLE PRECISION NOT NULL, -- Standard Gravitational Parameter G*M
    radius_km DOUBLE PRECISION NOT NULL,
    mass_kg DOUBLE PRECISION NOT NULL,
    j2_coefficient DOUBLE PRECISION DEFAULT 0.0,
    rotation_period_hours DOUBLE PRECISION,
    color_hex VARCHAR(10) DEFAULT '#38bdf8'
);

-- Spacecraft Configuration
CREATE TABLE IF NOT EXISTS spacecraft (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) DEFAULT 'SATELLITE', -- CUBESAT, SATELLITE, STATION, PROBE
    dry_mass_kg DOUBLE PRECISION NOT NULL,
    fuel_mass_kg DOUBLE PRECISION NOT NULL,
    fuel_capacity_kg DOUBLE PRECISION NOT NULL,
    isp_seconds DOUBLE PRECISION NOT NULL,
    max_thrust_newtons DOUBLE PRECISION NOT NULL,
    engine_type VARCHAR(50) DEFAULT 'CHEMICAL_BIPROPELLANT',
    cross_sectional_area_m2 DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    drag_coefficient DOUBLE PRECISION NOT NULL DEFAULT 2.2,
    solar_radiation_coeff DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    central_body_id VARCHAR(36) REFERENCES orbital_bodies(id),
    spacecraft_id VARCHAR(36) REFERENCES spacecraft(id),
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, SIMULATED, ACTIVE, COMPLETED
    objective VARCHAR(100) NOT NULL, -- ORBIT_TRANSFER, RENDEZVOUS, LUNAR_TRANSFER, etc.
    fidelity_mode VARCHAR(50) DEFAULT 'ADVANCED_J2_DRAG', -- BASIC_TWO_BODY, ADVANCED_J2_DRAG, HIGH_FIDELITY_NBODY
    epoch_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orbit Definitions (Initial and Target)
CREATE TABLE IF NOT EXISTS orbits (
    id VARCHAR(36) PRIMARY KEY,
    mission_id VARCHAR(36) REFERENCES missions(id) ON DELETE CASCADE,
    orbit_type VARCHAR(50) NOT NULL, -- INITIAL, TARGET, TRANSFER, FINAL
    semi_major_axis_km DOUBLE PRECISION NOT NULL,
    eccentricity DOUBLE PRECISION NOT NULL,
    inclination_deg DOUBLE PRECISION NOT NULL,
    raan_deg DOUBLE PRECISION NOT NULL,
    arg_periapsis_deg DOUBLE PRECISION NOT NULL,
    true_anomaly_deg DOUBLE PRECISION NOT NULL,
    period_minutes DOUBLE PRECISION,
    periapsis_altitude_km DOUBLE PRECISION,
    apoapsis_altitude_km DOUBLE PRECISION
);

-- Maneuver Nodes
CREATE TABLE IF NOT EXISTS maneuver_nodes (
    id VARCHAR(36) PRIMARY KEY,
    mission_id VARCHAR(36) REFERENCES missions(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    burn_type VARCHAR(50) NOT NULL, -- PROGRADE, RETROGRADE, NORMAL, ANTI_NORMAL, RADIAL_IN, RADIAL_OUT, CUSTOM
    delta_v_m_s DOUBLE PRECISION NOT NULL,
    delta_v_vector_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    delta_v_vector_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    delta_v_vector_z DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    burn_time_epoch TIMESTAMP WITH TIME ZONE NOT NULL,
    burn_duration_seconds DOUBLE PRECISION NOT NULL,
    fuel_consumed_kg DOUBLE PRECISION NOT NULL,
    is_executed BOOLEAN DEFAULT FALSE
);

-- Satellites (Catalog from CelesTrak / Space-Track)
CREATE TABLE IF NOT EXISTS satellites (
    id VARCHAR(36) PRIMARY KEY,
    norad_id INT UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    intl_designator VARCHAR(50),
    category VARCHAR(50) NOT NULL, -- CREWED, EARTH_OBSERVATION, NAVIGATION, COMMUNICATION, WEATHER, SCIENTIFIC, DEBRIS
    country_operator VARCHAR(100),
    epoch_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    mean_motion DOUBLE PRECISION NOT NULL,
    eccentricity DOUBLE PRECISION NOT NULL,
    inclination_deg DOUBLE PRECISION NOT NULL,
    raan_deg DOUBLE PRECISION NOT NULL,
    arg_perigee_deg DOUBLE PRECISION NOT NULL,
    mean_anomaly_deg DOUBLE PRECISION NOT NULL,
    tle_line1 TEXT NOT NULL,
    tle_line2 TEXT NOT NULL,
    data_source VARCHAR(50) DEFAULT 'CelesTrak',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_status VARCHAR(20) DEFAULT 'LIVE' -- LIVE, RECENT, CACHED, DEMO
);

-- Ground Stations
CREATE TABLE IF NOT EXISTS ground_stations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    latitude_deg DOUBLE PRECISION NOT NULL,
    longitude_deg DOUBLE PRECISION NOT NULL,
    altitude_m DOUBLE PRECISION NOT NULL,
    min_elevation_deg DOUBLE PRECISION DEFAULT 5.0
);

-- Simulation Results & Runs
CREATE TABLE IF NOT EXISTS simulations (
    id VARCHAR(36) PRIMARY KEY,
    mission_id VARCHAR(36) REFERENCES missions(id) ON DELETE CASCADE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    timestep_seconds DOUBLE PRECISION NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL,
    computation_time_ms DOUBLE PRECISION NOT NULL,
    fidelity VARCHAR(50) NOT NULL,
    total_delta_v_m_s DOUBLE PRECISION NOT NULL,
    total_fuel_consumed_kg DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED'
);

-- Telemetry Time-Series
CREATE TABLE IF NOT EXISTS telemetry_data (
    id BIGSERIAL PRIMARY KEY,
    simulation_id VARCHAR(36) REFERENCES simulations(id) ON DELETE CASCADE,
    time_offset_seconds DOUBLE PRECISION NOT NULL,
    pos_x_km DOUBLE PRECISION NOT NULL,
    pos_y_km DOUBLE PRECISION NOT NULL,
    pos_z_km DOUBLE PRECISION NOT NULL,
    vel_x_kms DOUBLE PRECISION NOT NULL,
    vel_y_kms DOUBLE PRECISION NOT NULL,
    vel_z_kms DOUBLE PRECISION NOT NULL,
    altitude_km DOUBLE PRECISION NOT NULL,
    speed_kms DOUBLE PRECISION NOT NULL,
    latitude_deg DOUBLE PRECISION NOT NULL,
    longitude_deg DOUBLE PRECISION NOT NULL,
    specific_energy_mj_kg DOUBLE PRECISION NOT NULL,
    fuel_remaining_kg DOUBLE PRECISION NOT NULL
);

-- Scenarios (For Comparison)
CREATE TABLE IF NOT EXISTS scenarios (
    id VARCHAR(36) PRIMARY KEY,
    mission_id VARCHAR(36) REFERENCES missions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    engine_isp DOUBLE PRECISION NOT NULL,
    thrust_n DOUBLE PRECISION NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    total_delta_v DOUBLE PRECISION NOT NULL,
    transfer_time_hours DOUBLE PRECISION NOT NULL,
    propellant_used_kg DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_satellites_norad ON satellites(norad_id);
CREATE INDEX idx_satellites_category ON satellites(category);
CREATE INDEX idx_missions_user ON missions(user_id);
CREATE INDEX idx_telemetry_sim ON telemetry_data(simulation_id, time_offset_seconds);
