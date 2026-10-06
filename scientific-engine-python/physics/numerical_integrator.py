"""
Numerical Integrator (Runge-Kutta 4th Order) with J2 and Drag Perturbations
"""
import math
import numpy as np
from .orbital_mechanics import MU_EARTH, R_EARTH, J2_EARTH


def atmospheric_density(altitude_km: float) -> float:
    """
    Exponential model for Earth upper atmosphere density (kg / m^3).
    """
    if altitude_km > 1000.0:
        return 0.0
    if altitude_km < 0.0:
        return 1.225
    # Standard scale height model approximation
    h0 = 200.0
    rho0 = 2.789e-10  # kg/m^3 at 200 km
    H = 37.5          # scale height km
    return rho0 * math.exp(-(altitude_km - h0) / H)


def gravitational_acceleration(r_vec: np.ndarray, fidelity: str = "ADVANCED_J2_DRAG") -> np.ndarray:
    """
    Compute acceleration in ECI frame including two-body and J2 oblateness.
    r_vec in km.
    """
    r = np.linalg.norm(r_vec)
    if r < 1e-6:
        return np.zeros(3)
    
    # Newtonian two-body acceleration
    a_newton = -(MU_EARTH / (r**3)) * r_vec
    
    if "J2" not in fidelity and fidelity != "HIGH_FIDELITY_NBODY" and fidelity != "ADVANCED_J2_DRAG":
        return a_newton
    
    # J2 Perturbation
    x, y, z = r_vec
    z2_r2 = (z / r)**2
    factor = -(1.5 * J2_EARTH * MU_EARTH * (R_EARTH**2)) / (r**5)
    
    ax_j2 = factor * x * (1.0 - 5.0 * z2_r2)
    ay_j2 = factor * y * (1.0 - 5.0 * z2_r2)
    az_j2 = factor * z * (3.0 - 5.0 * z2_r2)
    
    a_j2 = np.array([ax_j2, ay_j2, az_j2])
    return a_newton + a_j2


def drag_acceleration(r_vec: np.ndarray, v_vec: np.ndarray, 
                      mass_kg: float, cd: float, area_m2: float) -> np.ndarray:
    """
    Compute atmospheric drag deceleration in km/s^2.
    """
    r = np.linalg.norm(r_vec)
    altitude_km = r - R_EARTH
    if altitude_km > 800.0 or altitude_km <= 0:
        return np.zeros(3)
        
    rho = atmospheric_density(altitude_km)  # kg/m^3
    v_mag = np.linalg.norm(v_vec)           # km/s
    if v_mag < 1e-6:
        return np.zeros(3)
        
    # v in m/s: v_mag * 1000
    v_ms = v_mag * 1000.0
    # Drag force F = 0.5 * rho * v^2 * Cd * A (Newtons)
    f_drag_newtons = 0.5 * rho * (v_ms**2) * cd * area_m2
    # Acceleration in m/s^2 = F / m
    a_drag_ms2 = f_drag_newtons / mass_kg
    # Acceleration in km/s^2
    a_drag_kms2 = (a_drag_ms2 / 1000.0) * (-v_vec / v_mag)
    return a_drag_kms2


def rk4_step(state: np.ndarray, dt: float, fidelity: str, 
             mass_kg: float, cd: float, area_m2: float) -> np.ndarray:
    """
    Single step of Runge-Kutta 4th order.
    state = [rx, ry, rz, vx, vy, vz]
    """
    def derivatives(s: np.ndarray) -> np.ndarray:
        r = s[0:3]
        v = s[3:6]
        a = gravitational_acceleration(r, fidelity)
        if "DRAG" in fidelity or fidelity == "ADVANCED_J2_DRAG":
            a += drag_acceleration(r, v, mass_kg, cd, area_m2)
        return np.concatenate([v, a])

    k1 = derivatives(state)
    k2 = derivatives(state + 0.5 * dt * k1)
    k3 = derivatives(state + 0.5 * dt * k2)
    k4 = derivatives(state + dt * k3)

    return state + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)


def propagate_trajectory(initial_r: np.ndarray, initial_v: np.ndarray,
                         duration_sec: float, dt_sec: float,
                         fidelity: str = "ADVANCED_J2_DRAG",
                         mass_kg: float = 1000.0, cd: float = 2.2, area_m2: float = 2.0):
    """
    Propagate orbital state over time using RK4.
    """
    steps = int(duration_sec / dt_sec)
    history = []
    
    current_state = np.concatenate([initial_r, initial_v])
    t = 0.0
    
    for _ in range(steps + 1):
        r_curr = current_state[0:3]
        v_curr = current_state[3:6]
        r_mag = np.linalg.norm(r_curr)
        v_mag = np.linalg.norm(v_curr)
        alt = r_mag - R_EARTH
        
        # Geodetic approx
        lat = math.degrees(math.asin(np.clip(r_curr[2] / r_mag, -1.0, 1.0)))
        # Earth rotation angle in deg (omega ~ 360 / 86164 s)
        theta_earth = (t * 360.0 / 86164.09) % 360.0
        lon = (math.degrees(math.atan2(r_curr[1], r_curr[0])) - theta_earth + 180.0) % 360.0 - 180.0
        
        history.append({
            "time_sec": t,
            "pos_eci_km": r_curr.tolist(),
            "vel_eci_kms": v_curr.tolist(),
            "altitude_km": float(alt),
            "speed_kms": float(v_mag),
            "lat_deg": float(lat),
            "lon_deg": float(lon)
        })
        
        current_state = rk4_step(current_state, dt_sec, fidelity, mass_kg, cd, area_m2)
        t += dt_sec
        
    return history
