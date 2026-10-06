"""
Orbital Transfers & Maneuver Analysis
Hohmann Transfer, Bi-Elliptic Transfer, and Plane Changes
"""
import math
from .orbital_mechanics import MU_EARTH, G0


def calculate_hohmann_transfer(r1_km: float, r2_km: float, 
                               dry_mass_kg: float, fuel_mass_kg: float, isp_sec: float):
    """
    Compute classical two-impulse Hohmann transfer between coplanar circular orbits.
    """
    v1_init = math.sqrt(MU_EARTH / r1_km)
    v2_target = math.sqrt(MU_EARTH / r2_km)
    
    # Transfer ellipse semi-major axis
    a_transfer = (r1_km + r2_km) / 2.0
    
    # Velocity at periapsis and apoapsis of transfer ellipse
    v_transfer_periapsis = math.sqrt(MU_EARTH * (2.0 / r1_km - 1.0 / a_transfer))
    v_transfer_apoapsis = math.sqrt(MU_EARTH * (2.0 / r2_km - 1.0 / a_transfer))
    
    delta_v1 = abs(v_transfer_periapsis - v1_init)
    delta_v2 = abs(v2_target - v_transfer_apoapsis)
    delta_v_total = delta_v1 + delta_v2
    
    # Transfer duration (half of transfer orbit period)
    transfer_time_sec = math.pi * math.sqrt((a_transfer**3) / MU_EARTH)
    
    # Tsiolkovsky rocket equation for fuel mass
    m_initial = dry_mass_kg + fuel_mass_kg
    ve_kms = isp_sec * G0
    
    # Mass after burn 1
    m_after_burn1 = m_initial * math.exp(-delta_v1 / ve_kms)
    fuel_burn1 = m_initial - m_after_burn1
    
    # Mass after burn 2
    m_after_burn2 = m_after_burn1 * math.exp(-delta_v2 / ve_kms)
    fuel_burn2 = m_after_burn1 - m_after_burn2
    total_fuel_consumed = fuel_burn1 + fuel_burn2
    
    feasible = total_fuel_consumed <= fuel_mass_kg
    
    return {
        "transfer_type": "HOHMANN",
        "r1_km": r1_km,
        "r2_km": r2_km,
        "a_transfer_km": a_transfer,
        "delta_v1_kms": delta_v1,
        "delta_v2_kms": delta_v2,
        "total_delta_v_kms": delta_v_total,
        "total_delta_v_ms": delta_v_total * 1000.0,
        "transfer_time_sec": transfer_time_sec,
        "transfer_time_hours": transfer_time_sec / 3600.0,
        "fuel_consumed_kg": total_fuel_consumed,
        "fuel_remaining_kg": max(0.0, fuel_mass_kg - total_fuel_consumed),
        "is_feasible": feasible
    }


def calculate_plane_change(v_kms: float, delta_i_deg: float):
    """
    Calculate impulsive delta-v for pure inclination change:
    delta_v = 2 * v * sin(delta_i / 2)
    """
    delta_i_rad = math.radians(delta_i_deg)
    delta_v_kms = 2.0 * v_kms * math.sin(delta_i_rad / 2.0)
    return {
        "delta_i_deg": delta_i_deg,
        "orbital_speed_kms": v_kms,
        "delta_v_kms": delta_v_kms,
        "delta_v_ms": delta_v_kms * 1000.0
    }
