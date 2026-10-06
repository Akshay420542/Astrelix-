/**
 * Automated "What-If" Contingency & Constraint Solvers
 * Simulates thruster underburns, premature cutoffs, calculates orbital dispersions & autonomous recovery burns.
 */
import React, { useState } from 'react';
import {
  AlertOctagon,
  Flame,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { ContingencySimulation } from '../../types/advancedFeatures';
import { Mission } from '../../types/mission';
import { solveContingencyRecovery } from '../../physics/advancedPropagators';

interface WhatIfContingencyViewProps {
  mission: Mission;
  onChangeMission: (updated: Mission) => void;
  onRunSimulation: () => void;
}

export const WhatIfContingencyView: React.FC<WhatIfContingencyViewProps> = ({
  mission,
  onChangeMission,
  onRunSimulation
}) => {
  const [underburnPercent, setUnderburnPercent] = useState<number>(75); // 75% nominal thrust
  const [anomalyType, setAnomalyType] = useState<ContingencySimulation['anomalyType']>('THRUSTER_UNDERBURN');

  const initialAltKm = Math.round(mission.initialOrbit.a - 6378.137);
  const targetAltKm = mission.targetOrbit
    ? Math.round(mission.targetOrbit.a - 6378.137)
    : 35786;

  // Primary nominal burn delta-v from first maneuver or Hohmann default
  const nominalDv = mission.maneuvers[0]?.deltaV || 2426.5;

  // Solve contingency
  const contingencyResult: ContingencySimulation = solveContingencyRecovery(
    initialAltKm,
    targetAltKm,
    nominalDv,
    underburnPercent,
    mission.spacecraft
  );

  const handleInjectRecoveryBurn = () => {
    if (!contingencyResult.recoveryManeuver) return;
    const rec = contingencyResult.recoveryManeuver;

    const recoveryNode = {
      id: `recovery-burn-${Date.now().toString().slice(-4)}`,
      name: `Emergency Recovery Burn (Underburn Remediation)`,
      type: 'PROGRADE' as const,
      deltaV: rec.requiredCorrectionDeltaVMs,
      vector: [rec.requiredCorrectionDeltaVMs, 0, 0] as [number, number, number],
      trueAnomalyAtBurn: 0.0,
      burnEpochSeconds: rec.correctionBurnEpochSeconds,
      burnDurationSeconds: 45,
      fuelConsumedKg: rec.propellantRequiredKg,
      enabled: true
    };

    onChangeMission({
      ...mission,
      maneuvers: [...mission.maneuvers, recoveryNode]
    });
    onRunSimulation();
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            AUTOMATED "WHAT-IF" CONTINGENCY & CONSTRAINT SOLVER
          </h2>
          <p className="text-[11px] text-slate-400">
            Propulsion anomaly dispersions, abort boundaries, and autonomous recovery burns
          </p>
        </div>
        {contingencyResult.recoveryFeasible && (
          <button
            onClick={handleInjectRecoveryBurn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>INJECT RECOVERY MANEUVER</span>
          </button>
        )}
      </div>

      {/* Contingency Anomaly Scenario Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Underburn Yield</span>
          <span className="text-2xl font-bold text-amber-300 tabular-nums">
            {underburnPercent}% <span className="text-xs font-normal text-slate-400">Thrust</span>
          </span>
          <span className="text-[10px] text-rose-400 block mt-1">
            Deficit: -{(100 - underburnPercent)}% impulse
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Resulting Degraded Apoapsis</span>
          <span className="text-2xl font-bold text-white tabular-nums">
            {contingencyResult.resultingApoapsisKm.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">km</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Target: {targetAltKm.toLocaleString()} km
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Required Recovery Δv</span>
          <span className="text-2xl font-bold text-cyan-300 tabular-nums">
            {contingencyResult.recoveryManeuver?.requiredCorrectionDeltaVMs.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">m/s</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            At next orbit periapsis
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Recovery Feasibility</span>
          <span
            className={`text-2xl font-bold block ${
              contingencyResult.recoveryFeasible ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {contingencyResult.recoveryFeasible ? 'RECOVERABLE' : 'UNRECOVERABLE'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Tank margin check
          </span>
        </div>
      </div>

      {/* Anomaly Slider Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
        <span className="text-white font-semibold uppercase text-[11px] block pb-2 border-b border-slate-800">
          ANOMALY INJECTION PARAMETERS
        </span>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Thruster Output Efficiency (%)</span>
              <span className="text-white font-bold tabular-nums">{underburnPercent}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="99"
              step="1"
              value={underburnPercent}
              onChange={(e) => setUnderburnPercent(parseFloat(e.target.value))}
              className="w-full mt-2 accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Altitude Shortfall</span>
              <span className="text-base font-bold text-rose-400 tabular-nums">
                -{contingencyResult.dispersionDeviationKm.toLocaleString()} km
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Propellant Needed for Fix</span>
              <span className="text-base font-bold text-white tabular-nums">
                {contingencyResult.recoveryManeuver?.propellantRequiredKg.toFixed(1)} kg
              </span>
              <span className="text-[10px] text-slate-500 block">
                of {mission.spacecraft.fuelMass} kg available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Strategy Card */}
      {contingencyResult.recoveryManeuver && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] space-y-1">
          <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Contingency Recovery Strategy:</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed">
            In the event of a {underburnPercent}% thrust underburn, the spacecraft will coast in a lower intermediate orbit with apogee at {contingencyResult.resultingApoapsisKm.toLocaleString()} km.
            Executing a corrective periapsis impulse of <strong>{contingencyResult.recoveryManeuver.requiredCorrectionDeltaVMs} m/s</strong> at T+{Math.round(contingencyResult.recoveryManeuver.correctionBurnEpochSeconds / 60)} minutes restores nominal mission apogee at <strong>{targetAltKm.toLocaleString()} km</strong> with {contingencyResult.recoveryManeuver.recoveryConfidencePercent}% confidence.
          </p>
        </div>
      )}
    </div>
  );
};
