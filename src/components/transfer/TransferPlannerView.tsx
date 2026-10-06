/**
 * Orbit Transfer Planner (Hohmann, Bi-Elliptic & Plane Change Solver)
 * Includes Interactive Time-of-Flight (TOF) Estimator & Astrodynamic Phase Angle Calculator
 */
import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Clock,
  Zap,
  RotateCcw,
  Compass,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { Mission, TransferResult } from '../../types/mission';
import { CELESTIAL_BODIES } from '../../physics/constants';
import {
  calculateBiEllipticTransfer,
  calculateHohmannTransfer,
  calculatePlaneChangeDeltaV
} from '../../physics/transfers';

interface TransferPlannerViewProps {
  mission: Mission;
  onChangeMission: (updated: Mission) => void;
  onRunSimulation: () => void;
}

export const TransferPlannerView: React.FC<TransferPlannerViewProps> = ({
  mission,
  onChangeMission,
  onRunSimulation
}) => {
  const currentInitialAlt = Math.round(mission.initialOrbit.a - CELESTIAL_BODIES.earth.radius);
  const currentTargetAlt = mission.targetOrbit
    ? Math.round(mission.targetOrbit.a - CELESTIAL_BODIES.earth.radius)
    : 35786;

  const [initialAltKm, setInitialAltKm] = useState<number>(currentInitialAlt);
  const [targetAltKm, setTargetAltKm] = useState<number>(currentTargetAlt);
  const [transferType, setTransferType] = useState<'HOHMANN' | 'BI_ELLIPTIC' | 'PLANE_CHANGE'>('HOHMANN');
  const [intermediateAltKm, setIntermediateAltKm] = useState<number>(60000); // For bi-elliptic
  const [deltaIDeg, setDeltaIDeg] = useState<number>(28.5);

  const rEarth = CELESTIAL_BODIES.earth.radius;
  const muEarth = CELESTIAL_BODIES.earth.mu;
  const r1 = rEarth + Math.max(100, initialAltKm);
  const r2 = rEarth + Math.max(100, targetAltKm);
  const rb = rEarth + Math.max(r2, intermediateAltKm);

  // Compute transfers
  let transferResult: TransferResult;
  if (transferType === 'BI_ELLIPTIC') {
    transferResult = calculateBiEllipticTransfer(r1, r2, rb, mission.spacecraft);
  } else {
    transferResult = calculateHohmannTransfer(r1, r2, mission.spacecraft);
  }

  const planeChange = calculatePlaneChangeDeltaV(
    Math.sqrt(muEarth / r1),
    deltaIDeg
  );

  // --- TIME-OF-FLIGHT (TOF) ESTIMATOR CALCULATIONS ---
  // Transfer semi-major axis: at = (r1 + r2) / 2
  const aTransfer = (r1 + r2) / 2;
  // TOF is half the orbital period of the transfer ellipse: t = pi * sqrt(at^3 / mu)
  const tofSeconds = Math.PI * Math.sqrt(Math.pow(aTransfer, 3) / muEarth);
  const tofMinutes = tofSeconds / 60;
  const tofHours = tofSeconds / 3600;
  const tofDays = tofHours / 24;

  // Angular velocities of departure and target circular orbits (rad/s)
  const omega1 = Math.sqrt(muEarth / Math.pow(r1, 3));
  const omega2 = Math.sqrt(muEarth / Math.pow(r2, 3));

  // Angular distance traveled by target during transfer (degrees)
  const targetTravelRad = omega2 * tofSeconds;
  const targetTravelDeg = (targetTravelRad * 180) / Math.PI;

  // Required initial phase angle between chaser and target at burn 1: phi = 180° - omega2 * TOF
  let phaseAngleDeg = ((180 - targetTravelDeg) % 360 + 360) % 360;
  if (phaseAngleDeg > 180) phaseAngleDeg -= 360;

  // Synodic period between orbits (repetition period for optimal transfer window)
  const deltaOmega = Math.abs(omega1 - omega2);
  const synodicPeriodSec = deltaOmega > 1e-12 ? (2 * Math.PI) / deltaOmega : 0;
  const synodicPeriodHours = synodicPeriodSec / 3600;

  // Preset destination shortcuts
  const handleApplyPresetTarget = (alt: number) => {
    setTargetAltKm(alt);
  };

  const handleSyncFromCurrentMission = () => {
    setInitialAltKm(Math.round(mission.initialOrbit.a - rEarth));
    if (mission.targetOrbit) {
      setTargetAltKm(Math.round(mission.targetOrbit.a - rEarth));
    }
  };

  const handleApplyTransferToMission = () => {
    // Generate two maneuver nodes for the mission
    const node1 = {
      id: `hohmann-burn1-${Date.now()}`,
      name: `Hohmann Burn 1 (Periapsis Injection)`,
      type: 'PROGRADE' as const,
      deltaV: Math.round(transferResult.deltaV1 * 10) / 10,
      vector: [transferResult.deltaV1, 0, 0] as [number, number, number],
      trueAnomalyAtBurn: 0.0,
      burnEpochSeconds: 600,
      burnDurationSeconds: Math.round(
        transferResult.deltaV1 /
          (mission.spacecraft.maxThrust / (mission.spacecraft.dryMass + mission.spacecraft.fuelMass))
      ),
      fuelConsumedKg: Math.round(transferResult.fuelConsumedKg * 0.6),
      enabled: true
    };

    const node2 = {
      id: `hohmann-burn2-${Date.now()}`,
      name: `Hohmann Burn 2 (Apoapsis Circularization)`,
      type: 'PROGRADE' as const,
      deltaV: Math.round(transferResult.deltaV2 * 10) / 10,
      vector: [transferResult.deltaV2, 0, 0] as [number, number, number],
      trueAnomalyAtBurn: 180.0,
      burnEpochSeconds: Math.round(600 + transferResult.transferTimeSec),
      burnDurationSeconds: Math.round(
        transferResult.deltaV2 /
          (mission.spacecraft.maxThrust / (mission.spacecraft.dryMass + mission.spacecraft.fuelMass))
      ),
      fuelConsumedKg: Math.round(transferResult.fuelConsumedKg * 0.4),
      enabled: true
    };

    onChangeMission({
      ...mission,
      targetOrbit: {
        a: r2,
        e: 0.0001,
        i: mission.initialOrbit.i,
        raan: mission.initialOrbit.raan,
        argPeriapsis: 0,
        trueAnomaly: 180
      },
      maneuvers: [node1, node2]
    });
    onRunSimulation();
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            AUTOMATED ORBIT TRANSFER PLANNER
          </h2>
          <p className="text-[11px] text-slate-400">
            Hohmann transfers, Time-of-Flight (TOF) estimation & launch windows
          </p>
        </div>
        <button
          onClick={handleApplyTransferToMission}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>APPLY TO TRAJECTORY</span>
        </button>
      </div>

      {/* Transfer Type Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setTransferType('HOHMANN')}
          className={`p-2.5 rounded border text-left transition-colors ${
            transferType === 'HOHMANN'
              ? 'bg-cyan-950/60 border-cyan-600 text-cyan-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="font-semibold text-white">Hohmann Transfer</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Two-impulse coplanar minimum Δv</div>
        </button>

        <button
          onClick={() => setTransferType('BI_ELLIPTIC')}
          className={`p-2.5 rounded border text-left transition-colors ${
            transferType === 'BI_ELLIPTIC'
              ? 'bg-cyan-950/60 border-cyan-600 text-cyan-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="font-semibold text-white">Bi-Elliptic Transfer</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Three-impulse transfer via high apogee</div>
        </button>

        <button
          onClick={() => setTransferType('PLANE_CHANGE')}
          className={`p-2.5 rounded border text-left transition-colors ${
            transferType === 'PLANE_CHANGE'
              ? 'bg-cyan-950/60 border-cyan-600 text-cyan-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="font-semibold text-white">Plane Change (Δi)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pure inclination maneuver</div>
        </button>
      </div>

      {/* Altitude inputs & Sync Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-white font-semibold uppercase text-[11px]">
            TRANSFER BOUNDARY PARAMETERS
          </span>
          <button
            onClick={handleSyncFromCurrentMission}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-cyan-300 hover:text-white bg-slate-950 border border-slate-700 rounded transition-colors"
            title="Load altitudes from active mission state"
          >
            <RotateCcw className="w-3 h-3" />
            <span>SYNC FROM MISSION</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-[11px] block">Initial Altitude h₁ (km)</label>
            <input
              type="number"
              step="20"
              value={initialAltKm}
              onChange={(e) => setInitialAltKm(parseFloat(e.target.value) || 200)}
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
            <span className="text-[10px] text-slate-500">Departure radius r₁: {r1.toFixed(1)} km</span>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Target Altitude h₂ (km)</label>
            <input
              type="number"
              step="500"
              value={targetAltKm}
              onChange={(e) => setTargetAltKm(parseFloat(e.target.value) || 1000)}
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
            <span className="text-[10px] text-slate-500">Arrival radius r₂: {r2.toFixed(1)} km</span>
          </div>
        </div>

        {/* Quick Destination Target Presets */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-500 shrink-0">DESTINATION TARGETS:</span>
          {[
            { label: 'ISS (420 km)', alt: 420 },
            { label: 'Hubble (535 km)', alt: 535 },
            { label: 'Starlink (550 km)', alt: 550 },
            { label: 'GPS MEO (20,182 km)', alt: 20182 },
            { label: 'GEO (35,786 km)', alt: 35786 },
            { label: 'Lunar Injection (384,400 km)', alt: 384400 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleApplyPresetTarget(preset.alt)}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors border ${
                targetAltKm === preset.alt
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* DEDICATED TIME-OF-FLIGHT (TOF) ESTIMATOR SECTION */}
      <div className="bg-slate-900/90 border border-cyan-900/50 rounded-lg p-4 space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white uppercase text-xs">
              TIME-OF-FLIGHT (TOF) ESTIMATOR & PHASE GEOMETRY
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
            KEPLERIAN EXACT
          </span>
        </div>

        {/* Primary TOF Duration Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Duration (Hours)</span>
            <span className="text-xl font-bold text-amber-300 tabular-nums">
              {tofHours.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">hrs</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {tofMinutes < 120 ? `${tofMinutes.toFixed(1)} mins` : `${tofDays.toFixed(2)} days`}
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Seconds</span>
            <span className="text-xl font-bold text-slate-200 tabular-nums">
              {Math.round(tofSeconds).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">s</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Half-period t = π·√(a_t³/μ)
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Lead Phase Angle</span>
            <span className="text-xl font-bold text-cyan-300 tabular-nums">
              {phaseAngleDeg.toFixed(2)}°
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Required rendezvous lead
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Synodic Window</span>
            <span className="text-xl font-bold text-slate-200 tabular-nums">
              {synodicPeriodHours > 48
                ? `${(synodicPeriodHours / 24).toFixed(1)} d`
                : `${synodicPeriodHours.toFixed(1)} h`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Transfer window period
            </span>
          </div>
        </div>

        {/* Formula Derivation & Mathematical Explanation */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1.5 text-[11px]">
          <div className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Astrodynamic TOF Formulation:</span>
          </div>
          <div className="font-mono text-slate-400 leading-relaxed pl-5">
            <span className="text-cyan-300">t_TOF = π · √(a_t³ / μ)</span>
            {'  '}where{'  '}
            <span className="text-white">a_t = (r₁ + r₂) / 2 = {aTransfer.toFixed(1)} km</span>
            <br />
            <span className="text-slate-400">Target angular motion during coast: </span>
            <span className="text-slate-200 font-semibold">{targetTravelDeg.toFixed(2)}°</span>
            <span className="text-slate-500"> (ω₂ = {(omega2 * 1000).toFixed(4)} mrad/s)</span>
          </div>
        </div>

        {/* Transfer Timeline Sequence Progression */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            ESTIMATED FLIGHT TIMELINE
          </span>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-cyan-400 font-semibold block">T+00:00:00</span>
              <span className="text-slate-300 block mt-0.5">Burn 1: Injection</span>
              <span className="text-slate-500">Altitude: {initialAltKm.toLocaleString()} km</span>
            </div>

            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-amber-400 font-semibold block">
                T+{(tofHours / 2).toFixed(2)}h
              </span>
              <span className="text-slate-300 block mt-0.5">Coast Midpoint</span>
              <span className="text-slate-500">Radius: {aTransfer.toFixed(0)} km</span>
            </div>

            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400 font-semibold block">
                T+{tofHours.toFixed(2)}h
              </span>
              <span className="text-slate-300 block mt-0.5">Burn 2: Circularize</span>
              <span className="text-slate-500">Altitude: {targetAltKm.toLocaleString()} km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta-V & Propellant Summary Solution */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-semibold text-white uppercase">
            PROPULSION & DELTA-V BUDGET
          </span>
          <span
            className={`font-semibold ${
              transferResult.isFeasible ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {transferResult.isFeasible ? '● FEASIBLE WITH CURRENT PROPELLANT' : '▲ INSUFFICIENT PROPELLANT'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Total Required Δv</span>
            <span className="text-lg font-bold text-cyan-300 tabular-nums">
              {transferResult.totalDeltaV.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">m/s</span>
            </span>
            <span className="text-[10px] text-slate-500 block">
              {(transferResult.totalDeltaV / 1000).toFixed(3)} km/s
            </span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Propellant Used</span>
            <span className="text-lg font-bold text-slate-200 tabular-nums">
              {transferResult.fuelConsumedKg.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">kg</span>
            </span>
            <span className="text-[10px] text-slate-500 block">
              of {mission.spacecraft.fuelMass} kg loaded
            </span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Burn 1 (Periapsis)</span>
            <span className="text-lg font-bold text-slate-200 tabular-nums">
              {transferResult.deltaV1.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">m/s</span>
            </span>
            <span className="text-[10px] text-slate-500 block">Elliptical injection</span>
          </div>

          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Burn 2 (Apoapsis)</span>
            <span className="text-lg font-bold text-slate-200 tabular-nums">
              {transferResult.deltaV2.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">m/s</span>
            </span>
            <span className="text-[10px] text-slate-500 block">Circularization</span>
          </div>
        </div>
      </div>
    </div>
  );
};
