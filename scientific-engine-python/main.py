"""
FastAPI Scientific Computation Service
PHYSICS-ACCURATE ORBITAL MISSION PLANNER
"""
import time
import math
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from physics.orbital_mechanics import (
    MU_EARTH, R_EARTH, classical_to_rv, rv_to_classical
)
from physics.numerical_integrator import propagate_trajectory
from physics.transfers import calculate_hohmann_transfer, calculate_plane_change

app = FastAPI(
    title="Orbital Scientific Engine",
    description="Astrodynamics, Keplerian propagation, and trajectory optimization API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClassicalOrbit(BaseModel):
    a_km: float = Field(..., description="Semi-major axis in km")
    e: float = Field(..., description="Eccentricity")
    i_deg: float = Field(..., description="Inclination in degrees")
    raan_deg: float = Field(..., description="RAAN in degrees")
    arg_periapsis_deg: float = Field(..., description="Argument of Periapsis in degrees")
    true_anomaly_deg: float = Field(..., description="True Anomaly in degrees")


class SpacecraftParams(BaseModel):
    mass_kg: float = 1000.0
    dry_mass_kg: float = 600.0
    fuel_mass_kg: float = 400.0
    isp_sec: float = 310.0
    max_thrust_n: float = 450.0
    cd: float = 2.2
    area_m2: float = 2.5


class ManeuverRequest(BaseModel):
    time_sec: float
    prograde_ms: float = 0.0
    normal_ms: float = 0.0
    radial_ms: float = 0.0


class SimulationRequest(BaseModel):
    initial_orbit: ClassicalOrbit
    spacecraft: SpacecraftParams
    duration_sec: float = 5400.0
    timestep_sec: float = 10.0
    fidelity: str = "ADVANCED_J2_DRAG"
    maneuvers: Optional[List[ManeuverRequest]] = []


@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "Orbital Scientific Computation Engine",
        "version": "1.0.0",
        "physics_models": ["TWO_BODY", "ADVANCED_J2_DRAG", "HIGH_FIDELITY_NBODY"],
        "timestamp_utc": time.time()
    }


@app.post("/propagate")
def propagate_orbit(req: SimulationRequest):
    t_start = time.perf_counter()
    orb = req.initial_orbit
    r_eci, v_eci = classical_to_rv(
        orb.a_km, orb.e,
        math.radians(orb.i_deg),
        math.radians(orb.raan_deg),
        math.radians(orb.arg_periapsis_deg),
        math.radians(orb.true_anomaly_deg)
    )
    
    trajectory = propagate_trajectory(
        initial_r=r_eci,
        initial_v=v_eci,
        duration_sec=req.duration_sec,
        dt_sec=req.timestep_sec,
        fidelity=req.fidelity,
        mass_kg=req.spacecraft.mass_kg,
        cd=req.spacecraft.cd,
        area_m2=req.spacecraft.area_m2
    )
    
    t_end = time.perf_counter()
    return {
        "status": "SUCCESS",
        "computation_time_ms": round((t_end - t_start) * 1000.0, 2),
        "steps_count": len(trajectory),
        "trajectory": trajectory
    }


@app.post("/transfer/hohmann")
def hohmann_endpoint(r1_km: float, r2_km: float, dry_mass_kg: float = 600.0, 
                     fuel_mass_kg: float = 400.0, isp_sec: float = 310.0):
    if r1_km <= R_EARTH or r2_km <= R_EARTH:
        raise HTTPException(status_code=400, detail="Orbital radii must exceed Earth radius")
    return calculate_hohmann_transfer(r1_km, r2_km, dry_mass_kg, fuel_mass_kg, isp_sec)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
