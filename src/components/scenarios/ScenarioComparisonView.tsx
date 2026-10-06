/**
 * Mission Scenario Comparison View
 * Compare Scenario A vs Scenario B vs Scenario C
 */
import React, { useState } from 'react';
import { GitCompare, Plus, Trash2, Check, ArrowRight } from 'lucide-react';
import { ScenarioComparison } from '../../types/mission';

export const ScenarioComparisonView: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioComparison[]>([
    {
      id: 'scen-a',
      name: 'Scenario A: Classical Hohmann (Hydrazine)',
      spacecraftName: 'Orbital Pioneer-1',
      engineIsp: 320,
      thrustN: 650,
      totalDeltaV: 3904.7,
      fuelUsedKg: 1200.0,
      transferTimeHours: 5.27,
      finalAltitudeKm: 35786.0,
      maneuverCount: 2
    },
    {
      id: 'scen-b',
      name: 'Scenario B: Bi-Elliptic Transfer (High Apogee)',
      spacecraftName: 'Orbital Pioneer-1',
      engineIsp: 320,
      thrustN: 650,
      totalDeltaV: 4120.3,
      fuelUsedKg: 1290.0,
      transferTimeHours: 28.4,
      finalAltitudeKm: 35786.0,
      maneuverCount: 3
    },
    {
      id: 'scen-c',
      name: 'Scenario C: Electric Hall-Effect Thruster',
      spacecraftName: 'Ion Explorer-2',
      engineIsp: 1850,
      thrustN: 0.25,
      totalDeltaV: 4650.0,
      fuelUsedKg: 280.0,
      transferTimeHours: 1420.0,
      finalAltitudeKm: 35786.0,
      maneuverCount: 1
    }
  ]);

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            MISSION SCENARIO COMPARISON MATRIX
          </h2>
          <p className="text-[11px] text-slate-400">
            Trade-off study: Δv impulse, propellant mass, and time-of-flight (TOF)
          </p>
        </div>
      </div>

      {/* Side-by-side Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((scen, idx) => (
          <div
            key={scen.id}
            className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs truncate max-w-[200px]">
                {scen.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">
                #{idx + 1}
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Specific Impulse Isp</span>
                <span className="text-slate-200 font-semibold tabular-nums">{scen.engineIsp} s</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Total Required Δv</span>
                <span className="text-amber-300 font-bold tabular-nums">
                  {scen.totalDeltaV.toFixed(1)} m/s
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Propellant Consumption</span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {scen.fuelUsedKg.toFixed(1)} kg
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Transfer Duration</span>
                <span className="text-slate-200 font-semibold tabular-nums">
                  {scen.transferTimeHours > 48
                    ? `${(scen.transferTimeHours / 24).toFixed(1)} days`
                    : `${scen.transferTimeHours.toFixed(1)} hours`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Maneuver Burns</span>
                <span className="text-slate-200 tabular-nums">{scen.maneuverCount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              Vehicle: {scen.spacecraftName}
            </div>
          </div>
        ))}
      </div>

      {/* Engineering Recommendation Note */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400">
        <span className="text-cyan-400 font-bold">TRADE STUDY SUMMARY: </span>
        Scenario A delivers the minimum time-of-flight (5.27 hrs) for standard GEO insertion.
        Scenario C (Electric Hall-Effect) saves 76% propellant mass (280 kg vs 1200 kg) at the expense of a 59-day low-thrust spiral transfer.
      </div>
    </div>
  );
};
