# SYSTEM ARCHITECTURE SPECIFICATION
## Physics-Accurate Orbital Mission Planner

### 1. Monorepo Organization

```
/
├── frontend/                  # React 19 + TypeScript + Three.js application
│   ├── src/
│   │   ├── components/3d/     # WebGL Viewport, shaders, celestial bodies, camera
│   │   ├── physics/           # In-browser numerical & Keplerian engine
│   │   ├── data/              # Ephemeris, TLE catalogs, preset missions
│   │   └── api/               # Gateway client to Java/Python backends
├── backend-java/              # Enterprise Spring Boot 3 API
│   ├── src/main/java/com/orbital/planner/
│   │   ├── controller/        # REST controllers (/api/missions, /api/simulations)
│   │   ├── service/           # Mission orchestration, Celestrack sync
│   │   └── model/             # JPA Entities (Mission, Spacecraft, Orbit, Node)
├── scientific-engine-python/  # FastAPI Numerical Scientific Microservice
│   ├── physics/               # RK4, J2 Perturbation, Hohmann, Lambert solvers
│   └── main.py                # REST endpoints (/simulate, /propagate, /transfer)
└── database/                  # Relational database schemas
    ├── schema.sql             # PostgreSQL & SQLite DDL
    └── seeds.sql              # Standard astronomical & satellite seeds
```

### 2. Communication Pipeline

1. **Frontend Request**: The React interface dispatches trajectory execution parameters (Spacecraft dry mass, fuel, thrust, initial orbital elements $(a, e, i, \Omega, \omega, \nu)$, target orbit, maneuver sequence).
2. **Java Orchestration**: Spring Boot persists the simulation run, checks cached ephemerides, logs telemetry parameters, and forwards the compute request to Python via HTTP/gRPC.
3. **Scientific Engine (Python)**: Executes high-speed vectorized propagation (SciPy/NumPy RK45 or Keplerian universal variables). Returns time-series state vectors $[x, y, z, v_x, v_y, v_z]$, osculating orbital elements, $\Delta v$ consumption, and ground tracks.
4. **Resilient Local Execution**: In local or browser-only modes, the bundled TypeScript scientific engine (`src/physics/`) executes identical Runge-Kutta 4th order and Keplerian mathematics with zero network latency, while displaying clear connectivity indicators for the backend microservices.
