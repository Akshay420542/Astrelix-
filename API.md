# REST & WEBSOCKET API SPECIFICATION
## Orbital Mission Planner Service Contracts

### Base URLs
- Java API Gateway: `http://localhost:8080/api`
- Python Scientific Engine: `http://localhost:8000`
- Browser Proxy / Dev: `/api`

---

### Java Endpoints

#### 1. Missions
- `GET /api/missions`: List user/system missions.
- `GET /api/missions/{id}`: Detailed mission configuration.
- `POST /api/missions`: Create new orbital mission.
- `PUT /api/missions/{id}`: Update mission parameters.
- `DELETE /api/missions/{id}`: Remove mission.

#### 2. Spacecraft
- `GET /api/spacecraft`: Retrieve spacecraft inventory.
- `POST /api/spacecraft`: Create custom spacecraft specification (mass, ISP, thrust, Cd, area).

#### 3. Simulations
- `POST /api/simulations/run`: Execute numerical propagation job.
- `GET /api/simulations/{id}/telemetry`: Retrieve time-series trajectory $[t, x, y, z, v_x, v_y, v_z, \text{alt}, v]$.

#### 4. Satellite Ephemeris
- `GET /api/satellites`: Retrieve tracked satellites with TLE data.
- `GET /api/satellites/{noradId}`: Retrieve single satellite state.
- `GET /api/satellite-data/status`: Return data provider status (CelesTrak, Space-Track, Horizons).

---

### Python Scientific Engine Endpoints

#### `POST /simulate`
Request:
```json
{
  "initial_state": {
    "a_km": 6878.137,
    "e": 0.001,
    "i_deg": 51.64,
    "raan_deg": 120.5,
    "arg_periapsis_deg": 45.0,
    "true_anomaly_deg": 0.0
  },
  "spacecraft": {
    "mass_kg": 1500.0,
    "cd": 2.2,
    "area_m2": 4.5
  },
  "propagation": {
    "duration_sec": 5400,
    "timestep_sec": 10,
    "fidelity": "ADVANCED_J2_DRAG"
  },
  "maneuvers": [
    {
      "time_sec": 2700,
      "delta_v_vector": [150.0, 0.0, 0.0]
    }
  ]
}
```

Response:
```json
{
  "status": "COMPLETED",
  "computation_time_ms": 42.8,
  "timesteps_count": 541,
  "delta_v_total_ms": 150.0,
  "fuel_consumed_kg": 72.4,
  "trajectory": [
    {
      "time_sec": 0,
      "pos_eci_km": [4280.1, 5100.2, 1920.4],
      "vel_eci_kms": [-5.1, 4.2, 3.8],
      "altitude_km": 500.0,
      "speed_kms": 7.61,
      "lat_deg": 16.4,
      "lon_deg": -45.2
    }
  ]
}
```

#### `POST /transfer/hohmann`
Calculates Hohmann transfer between circular orbits $r_1$ and $r_2$. Returns $\Delta v_1$, $\Delta v_2$, $\Delta v_{\text{total}}$, $t_{\text{transfer}}$, and trajectory points.

#### `POST /visibility/passes`
Calculates passes over a ground station given coordinates $(\text{lat}, \text{lon}, \text{alt})$ and horizon elevation limit.
