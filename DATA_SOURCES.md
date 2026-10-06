# ORBITAL DATA SOURCES & INGESTION PROTOCOLS

### 1. Data Providers

#### A. CelesTrak (Primary Public TLE Source)
- **URL**: `https://celestrak.org/NORAD/elements/gp.php`
- **Format**: Two-Line Element sets (TLE) / OMM (Orbit Mean-Elements Message JSON)
- **Protocol**: HTTPS REST GET
- **Update Frequency**: ~2-6 hours per satellite
- **Status Indicator**: `LIVE` / `RECENT` / `CACHED` / `OFFLINE`

#### B. NASA/JPL Horizons Ephemeris
- **URL**: `https://ssd.jpl.nasa.gov/api/horizons.api`
- **Format**: Vector tables / Osculating orbital elements
- **Purpose**: Precise planetary, lunar, and deep-space trajectory states in J2000 ECI/Ecliptic frames.

#### C. Space-Track.org
- **URL**: `https://www.space-track.org/basicspacedata/query/`
- **Requires**: User Account & REST Authentication (`SPACETRACK_USERNAME`, `SPACETRACK_PASSWORD`)
- **Status Indicator**: `CONFIGURED` / `NOT CONFIGURED`

---

### 2. Scientific Data Provenance Contract
Every satellite and spacecraft in this platform strictly displays:
- **Satellite / Catalog Name** (e.g., ISS ZARYA)
- **NORAD ID** (e.g., 25544)
- **Data Source** (e.g., CelesTrak / Space-Track / NASA Horizons)
- **Timestamp of Epoch** (UTC)
- **Propagation Method** (SGP4 for TLEs, Two-Body Keplerian, or Numerical RK4)
- **Data Quality Status**:
  - `LIVE`: Received and propagated within the last hour.
  - `RECENT`: Epoch $<24$ hours old.
  - `CACHED`: Network fallback to local cache, timestamp displayed.
  - `DEMO DATA`: Deterministic educational demonstration model.
