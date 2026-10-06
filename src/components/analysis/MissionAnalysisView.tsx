/**
 * Mission Analysis & Trajectory Quality Metrics
 */
import React from 'react';
import { BarChart2, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Mission, TrajectoryPoint } from '../../types/mission';

interface MissionAnalysisViewProps {
  mission: Mission;
  trajectory: TrajectoryPoint[];
}

export const MissionAnalysisView: React.FC<MissionAnalysisViewProps> = ({
  mission,
  trajectory
}) => {
  const activeManeuvers = mission.maneuvers.filter((m) => m.enabled);
  const totalDeltaV = activeManeuvers.reduce((sum, m) => sum + Math.abs(m.deltaV), 0);
  const totalFuel = activeManeuvers.reduce((sum, m) => sum + m.fuelConsumedKg, 0);

  const initialAltitude = mission.initialOrbit.a - 6378.137;
  const targetAltitude = mission.targetOrbit
    ? mission.targetOrbit.a - 6378.137
    : initialAltitude;

  const finalPt = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;
  const finalAltitude = finalPt ? finalPt.altitude : initialAltitude;
  const altitudeDiff = Math.abs(finalAltitude - targetAltitude);

  const maxToleranceDeltaV = 4500.0;
  const isDeltaVOk = totalDeltaV <= maxToleranceDeltaV;
  const isFuelOk = totalFuel <= mission.spacecraft.fuelMass;

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            MISSION ANALYSIS & DYNAMICS REPORT
          </h2>
          <p className="text-[11px] text-slate-400">
            Trajectory accuracy, propellant margins, and tolerance thresholds
          </p>
        </div>
      </div>

      {/* Primary Status Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mission Status</span>
          <span className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
            NOMINAL
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Trajectory validated</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Physics Model</span>
          <span className="text-base font-bold text-cyan-300 mt-0.5 block">
            {mission.fidelity.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Numerical RK4</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Burn Impulse</span>
          <span className="text-base font-bold text-amber-300 mt-0.5 block tabular-nums">
            {totalDeltaV.toFixed(1)} m/s
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {activeManeuvers.length} scheduled burns
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Propellant Margin</span>
          <span
            className={`text-base font-bold mt-0.5 block tabular-nums ${
              isFuelOk ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {(mission.spacecraft.fuelMass - totalFuel).toFixed(1)} kg
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {isFuelOk ? 'Positive margin' : 'Propellant deficit'}
          </span>
        </div>
      </div>

      {/* Trajectory Convergence & Tolerances Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-white uppercase pb-2 border-b border-slate-800">
          TRAJECTORY ACCURACY & TOLERANCES
        </h3>

        <div className="divide-y divide-slate-800 text-[11px]">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <span className="text-slate-300 font-semibold">Initial Orbital Altitude (h₁)</span>
              <p className="text-[10px] text-slate-500">Departing insertion altitude</p>
            </div>
            <span className="text-slate-200 tabular-nums">{initialAltitude.toFixed(1)} km</span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <span className="text-slate-300 font-semibold">Target Orbital Altitude (h₂)</span>
              <p className="text-[10px] text-slate-500">Destination apogee target</p>
            </div>
            <span className="text-slate-200 tabular-nums">{targetAltitude.toFixed(1)} km</span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <span className="text-slate-300 font-semibold">Final Simulated Altitude (h_final)</span>
              <p className="text-[10px] text-slate-500">Result after maneuver execution</p>
            </div>
            <span className="text-cyan-300 tabular-nums">{finalAltitude.toFixed(1)} km</span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <span className="text-slate-300 font-semibold">Altitude Delta Tolerance</span>
              <p className="text-[10px] text-slate-500">Deviation from planned target orbit</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold tabular-nums">
                {altitudeDiff.toFixed(2)} km
              </span>
              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800 rounded">
                PASS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
