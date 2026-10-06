# PHYSICS-ACCURATE ORBITAL MISSION PLANNER
## Real-Time Space Mission Simulation & Analysis Platform
> *"Design. Simulate. Analyze. Navigate."*

---

### Overview
Physics-Accurate Orbital Mission Planner is an aerospace-grade orbital analysis, mission trajectory design, and real-time spacecraft simulation platform. Inspired by NASA/ESA mission control centers and STK (Systems Tool Kit), this environment enables aerospace engineers, students, and researchers to design high-fidelity orbital missions, compute impulsive and finite maneuvers, simulate Hohmann & bi-elliptic transfers, inspect real-time satellite telemetry, project ground tracks, and validate numerical simulations against analytical mechanics.

---

### Architecture Overview

```
                                      +-------------------------------+
                                      |   React 19 + TypeScript UI    |
                                      |   Three.js 3D WebGL Viewport  |
                                      +---------------+---------------+
                                                      |
                                                      | REST / WebSocket
                                                      v
                                      +---------------+---------------+
                                      |   Java 21 Spring Boot API     |
                                      |   - Mission Management        |
                                      |   - Telemetry Streamer        |
                                      |   - Spacecraft State DB       |
                                      +---------------+---------------+
                                                      |
                                                      | gRPC / REST (JSON)
                                                      v
                                      +---------------+---------------+
                                      |   Python Scientific Engine    |
                                      |   (FastAPI + NumPy + SciPy)   |
                                      |   - RK4 / Keplerian Solver    |
                                      |   - J2 / Drag / Perturbations |
                                      |   - Transfer Optimizer        |
                                      +---------------+---------------+
                                                      |
                          +---------------------------+---------------------------+
                          |                                                       |
                          v                                                       v
            +-------------+-------------+                           +-------------+-------------+
            |    PostgreSQL / SQLite    |                           | CelesTrak / NASA Horizons |
            |    Orbital State Store    |                           | Ephemeris & TLE Ingestion |
            +---------------------------+                           +---------------------------+
```

---

### Key Capabilities
1. **Realistic 3D Space Viewport**:
   - Physically-scaled Earth with day/night terminator, atmosphere scattering, realistic clouds, city illuminations, Sun corona, Moon, and planetary bodies.
   - Dynamic camera controller: Orbit, Follow Spacecraft, Earth-Centric, Solar-System, and Orbital Plane viewports.
   - Smooth scale compression (Real Scale, Mission Scale, Earth-Centric, Solar Scale).

2. **Modular Scientific Physics Engine**:
   - **Basic**: Keplerian two-body propagation using eccentric anomaly Newton-Raphson solvers.
   - **Advanced**: Runge-Kutta 4th-order (RK4) numerical integrator with Earth $J_2$ zonal harmonic oblateness and atmospheric exponential drag ($F_d = \frac{1}{2} \rho v^2 C_d A$).
   - **Experimental / High-Fidelity**: 3rd-body lunar/solar perturbation hooks and Solar Radiation Pressure (SRP).

3. **Maneuver & Transfer Planners**:
   - Prograde/Retrograde, Normal/Anti-normal, Radial-in/Radial-out impulsive burn planning.
   - Hohmann Transfer & Bi-Elliptic Transfer solvers with exact $\Delta v_1$, $\Delta v_2$, transfer time ($t_{\text{transfer}} = \pi \sqrt{\frac{a_t^3}{\mu}}$), and propellant mass consumption via Tsiolkovsky rocket equation.
   - Inclination plane-change calculation ($\Delta v = 2 v \sin(\Delta i / 2)$).

4. **Real Orbital Data Ingestion (CelesTrak / TLE)**:
   - Live/cached catalog tracking of ISS (ZARYA), Hubble Space Telescope, Tiangong, GPS Block III, Starlink constellations, Landsat-9, Chandra X-Ray Observatory, GOES-16, and Sentinel-6.
   - Data provenance labels: Live, Recent, Cached, or Deterministic Demo data with timestamps and propagation method indicators.

5. **2D Ground Track & Pass Predictor**:
   - Greenwich Mean Sidereal Time (GMST) and Earth rotation angle propagation.
   - Sub-satellite latitude/longitude ground track with multi-orbit projection (1 to 5 orbits).
   - Ground station elevation, AOS (Acquisition of Signal), LOS (Loss of Signal), and visibility footprints.

6. **Engineering Validation**:
   - Dedicated analytical benchmark suite comparing computed orbits against closed-form solutions (circular energy conservation, vis-viva velocity, Hohmann analytical $\Delta v$).
