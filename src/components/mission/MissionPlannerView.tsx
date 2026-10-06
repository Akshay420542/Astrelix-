/**
 * Mission Planner & Creation View
 */
import React, { useState } from 'react';
import {
  Compass,
  Check,
  Globe,
  Rocket,
  CircleDot,
  Layers,
  Sparkles
} from 'lucide-react';
import { CelestialBodyId, Mission, MissionObjective, PhysicsFidelity } from '../../types/mission';
import { CELESTIAL_BODIES } from '../../physics/constants';
import { PRESET_MISSIONS } from '../../data/presetMissions';

interface MissionPlannerViewProps {
  mission: Mission;
  onChangeMission: (updated: Mission) => void;
  onRunSimulation: () => void;
}

export const MissionPlannerView: React.FC<MissionPlannerViewProps> = ({
  mission,
  onChangeMission,
  onRunSimulation
}) => {
  const [step, setStep] = useState<number>(1);

  const bodies: CelestialBodyId[] = ['earth', 'moon', 'mars', 'sun', 'jupiter'];

  const objectives: { id: MissionObjective; label: string; desc: string }[] = [
    { id: 'ORBIT_TRANSFER', label: 'Orbit Transfer (Hohmann / Plane Change)', desc: 'Raise, lower or circularize orbital altitude' },
    { id: 'STATION_KEEPING', label: 'Station Keeping & Drag Reboost', desc: 'Periodic propulsion to counter atmospheric drag' },
    { id: 'RENDEZVOUS', label: 'Orbital Rendezvous & Proximity', desc: 'Phase and intercept target satellite' },
    { id: 'LUNAR_INJECTION', label: 'Trans-Lunar Injection (TLI)', desc: 'High-energy elliptical transfer to Moon gravity sphere' },
    { id: 'EARTH_OBSERVATION', label: 'Sun-Synchronous Observation', desc: 'Polar orbit with balanced nodal precession' }
  ];

  const handleApplyPreset = (preset: Mission) => {
    onChangeMission({ ...preset });
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            MISSION CONFIGURATION
          </h2>
          <p className="text-[11px] text-slate-400">Design trajectory parameters and constraints</p>
        </div>
        <button
          onClick={onRunSimulation}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors"
        >
          PROPAGATE NOW
        </button>
      </div>

      {/* Preset Mission Quick Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-slate-400 uppercase tracking-wider">Load Mission Preset:</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_MISSIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`p-2.5 rounded border text-left transition-colors ${
                mission.id === p.id
                  ? 'bg-cyan-950/70 border-cyan-700 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-semibold text-xs text-white truncate">{p.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{p.objective}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step Wizard Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
        {/* Step 1: General Info */}
        <div className="space-y-2">
          <label className="text-slate-300 font-semibold block uppercase">1. Mission Name & Central Body</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 text-[11px]">Mission Name</span>
              <input
                type="text"
                value={mission.name}
                onChange={(e) => onChangeMission({ ...mission, name: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Primary Celestial Body</span>
              <select
                value={mission.centralBody}
                onChange={(e) =>
                  onChangeMission({ ...mission, centralBody: e.target.value as CelestialBodyId })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              >
                {bodies.map((b) => (
                  <option key={b} value={b}>
                    {CELESTIAL_BODIES[b].name} (μ = {CELESTIAL_BODIES[b].mu.toLocaleString()} km³/s²)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Mission Objective */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-slate-300 font-semibold block uppercase">2. Mission Objective</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {objectives.map((obj) => (
              <button
                key={obj.id}
                onClick={() => onChangeMission({ ...mission, objective: obj.id })}
                className={`p-2.5 rounded border text-left transition-colors ${
                  mission.objective === obj.id
                    ? 'bg-cyan-950/60 border-cyan-600 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="font-semibold text-white">{obj.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{obj.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Classical Initial Orbit Elements */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-slate-300 font-semibold block uppercase">
            3. Initial Orbit (Classical Keplerian Elements)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 text-[11px]">Semi-major Axis a (km)</span>
              <input
                type="number"
                step="10"
                value={mission.initialOrbit.a}
                onChange={(e) =>
                  onChangeMission({
                    ...mission,
                    initialOrbit: { ...mission.initialOrbit, a: parseFloat(e.target.value) || 6778 }
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
              />
              <span className="text-[10px] text-slate-500">
                Alt: {(mission.initialOrbit.a - 6378.14).toFixed(1)} km
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px]">Eccentricity e (0 to 0.99)</span>
              <input
                type="number"
                step="0.001"
                min="0"
                max="0.999"
                value={mission.initialOrbit.e}
                onChange={(e) =>
                  onChangeMission({
                    ...mission,
                    initialOrbit: { ...mission.initialOrbit, e: parseFloat(e.target.value) || 0.001 }
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px]">Inclination i (deg)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="180"
                value={mission.initialOrbit.i}
                onChange={(e) =>
                  onChangeMission({
                    ...mission,
                    initialOrbit: { ...mission.initialOrbit, i: parseFloat(e.target.value) || 0 }
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px]">RAAN Ω (deg)</span>
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={mission.initialOrbit.raan}
                onChange={(e) =>
                  onChangeMission({
                    ...mission,
                    initialOrbit: { ...mission.initialOrbit, raan: parseFloat(e.target.value) || 0 }
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px]">Arg of Periapsis ω (deg)</span>
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={mission.initialOrbit.argPeriapsis}
                onChange={(e) =>
                  onChangeMission({
                    ...mission,
                    initialOrbit: { ...mission.initialOrbit, argPeriapsis: parseFloat(e.target.value) || 0 }
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px]">True Anomaly ν (deg)</span>
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={mission.initialOrbit.trueAnomaly}
                onChange={(e) =>
                  onChangeMission({
                    ...mission,
                    initialOrbit: { ...mission.initialOrbit, trueAnomaly: parseFloat(e.target.value) || 0 }
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Physics Model Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-slate-300 font-semibold block uppercase">
            4. Physics Fidelity Model
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { id: 'BASIC_TWO_BODY', label: 'BASIC (Two-Body)', desc: 'Keplerian Newtonian unperturbed gravity' },
              { id: 'ADVANCED_J2_DRAG', label: 'ADVANCED (J2 + Drag)', desc: 'Earth oblateness J2 + upper atmospheric drag' },
              { id: 'HIGH_FIDELITY_NBODY', label: 'HIGH-FIDELITY (Planned)', desc: '3rd-body Lunar/Solar perturbations & SRP' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => onChangeMission({ ...mission, fidelity: f.id as PhysicsFidelity })}
                className={`p-2.5 rounded border text-left transition-colors ${
                  mission.fidelity === f.id
                    ? 'bg-cyan-950/60 border-cyan-600 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="font-semibold text-white">{f.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
