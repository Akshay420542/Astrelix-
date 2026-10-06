"""
Orbital Mechanics & Coordinate Transformations
Physics-Accurate Orbital Mission Planner
"""
import math
import numpy as np

# Gravitational Parameters and Physical Constants
MU_EARTH = 398600.4418  # km^3 / s^2
R_EARTH = 6378.137      # km (WGS-84 equatorial radius)
J2_EARTH = 1.08263e-3   # Earth second zonal harmonic (oblateness)
G0 = 9.80665e-3         # km / s^2 standard gravity


def solve_kepler(M: float, e: float, tol: float = 1e-12, max_iter: int = 100) -> float:
    """Solve Kepler's Equation M = E - e*sin(E) using Newton-Raphson."""
    M = M % (2 * math.pi)
    E = M if e < 0.8 else math.pi
    for _ in range(max_iter):
        f = E - e * math.sin(E) - M
        f_prime = 1.0 - e * math.cos(E)
        dE = -f / f_prime
        E += dE
        if abs(dE) < tol:
            break
    return E


def classical_to_rv(a: float, e: float, i_rad: float, raan_rad: float, 
                    arg_p_rad: float, nu_rad: float, mu: float = MU_EARTH):
    """
    Convert classical Keplerian orbital elements to ECI position and velocity vectors.
    """
    p = a * (1.0 - e**2)
    r_mag = p / (1.0 + e * math.cos(nu_rad))
    
    # Position in orbital plane (PQW frame)
    r_pqw = np.array([
        r_mag * math.cos(nu_rad),
        r_mag * math.sin(nu_rad),
        0.0
    ])
    
    # Velocity in orbital plane (PQW frame)
    sqrt_mu_p = math.sqrt(mu / p)
    v_pqw = np.array([
        -sqrt_mu_p * math.sin(nu_rad),
        sqrt_mu_p * (e + math.cos(nu_rad)),
        0.0
    ])
    
    # Rotation matrix from PQW to ECI
    cos_O = math.cos(raan_rad)
    sin_O = math.sin(raan_rad)
    cos_w = math.cos(arg_p_rad)
    sin_w = math.sin(arg_p_rad)
    cos_i = math.cos(i_rad)
    sin_i = math.sin(i_rad)
    
    R = np.array([
        [cos_O * cos_w - sin_O * sin_w * cos_i, -cos_O * sin_w - sin_O * cos_w * cos_i, sin_O * sin_i],
        [sin_O * cos_w + cos_O * sin_w * cos_i, -sin_O * sin_w + cos_O * cos_w * cos_i, -cos_O * sin_i],
        [sin_w * sin_i, cos_w * sin_i, cos_i]
    ])
    
    r_eci = R @ r_pqw
    v_eci = R @ v_pqw
    return r_eci, v_eci


def rv_to_classical(r_eci: np.ndarray, v_eci: np.ndarray, mu: float = MU_EARTH):
    """
    Convert ECI position and velocity vectors to classical Keplerian elements.
    """
    r = np.linalg.norm(r_eci)
    v = np.linalg.norm(v_eci)
    
    h_vec = np.cross(r_eci, v_eci)
    h = np.linalg.norm(h_vec)
    
    # Line of nodes
    n_vec = np.cross([0, 0, 1], h_vec)
    n = np.linalg.norm(n_vec)
    
    # Eccentricity vector
    e_vec = (1.0 / mu) * ((v**2 - mu / r) * r_eci - np.dot(r_eci, v_eci) * v_eci)
    e = np.linalg.norm(e_vec)
    
    # Specific orbital energy
    energy = (v**2) / 2.0 - (mu / r)
    a = -mu / (2.0 * energy) if abs(energy) > 1e-12 else float('inf')
    
    # Inclination
    i_rad = math.acos(np.clip(h_vec[2] / h, -1.0, 1.0))
    
    # RAAN
    if n > 1e-12:
        raan_rad = math.acos(np.clip(n_vec[0] / n, -1.0, 1.0))
        if n_vec[1] < 0:
            raan_rad = 2 * math.pi - raan_rad
    else:
        raan_rad = 0.0
        
    # Argument of periapsis
    if n > 1e-12 and e > 1e-12:
        arg_p_rad = math.acos(np.clip(np.dot(n_vec, e_vec) / (n * e), -1.0, 1.0))
        if e_vec[2] < 0:
            arg_p_rad = 2 * math.pi - arg_p_rad
    else:
        arg_p_rad = 0.0
        
    # True anomaly
    if e > 1e-12:
        nu_rad = math.acos(np.clip(np.dot(e_vec, r_eci) / (e * r), -1.0, 1.0))
        if np.dot(r_eci, v_eci) < 0:
            nu_rad = 2 * math.pi - nu_rad
    else:
        nu_rad = 0.0
        
    return {
        "a_km": float(a),
        "e": float(e),
        "i_deg": math.degrees(i_rad),
        "raan_deg": math.degrees(raan_rad),
        "arg_periapsis_deg": math.degrees(arg_p_rad),
        "true_anomaly_deg": math.degrees(nu_rad),
        "period_sec": 2 * math.pi * math.sqrt(a**3 / mu) if a > 0 else 0.0,
        "energy_mj_kg": float(energy),
        "angular_momentum_km2_s": float(h)
    }
