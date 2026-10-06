/**
 * Spacecraft Configuration & Propulsion Parameter Editor
 */
import React from 'react';
import { Rocket, Gauge, Scale, Fuel, Flame } from 'lucide-react';
import { SpacecraftConfig } from '../../types/mission';

interface SpacecraftConfigViewProps {
  spacecraft: SpacecraftConfig;
  onChangeSpacecraft: (updated: SpacecraftConfig) => void;
}

export const SpacecraftConfigView: React.FC<SpacecraftConfigViewProps> = ({
  spacecraft,
  onChangeSpacecraft
}) => {
  // Astrodynamic calculations for vehicle performance
  const wetMass = spacecraft.dryMass + spacecraft.fuelMass;
  const g0 = 9.80665;
  const deltaVAvailable =
    spacecraft.dryMass > 0
      ? spacecraft.isp * g0 * Math.log(wetMass / spacecraft.dryMass)
      : 0;
  const twr = wetMass > 0 ? spacecraft.maxThrust / (wetMass * g0) : 0;
  const fuelPercent =
    spacecraft.fuelCapacity > 0
      ? (spacecraft.fuelMass / spacecraft.fuelCapacity) * 100
      : 0;

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Rocket className="w-4 h-4 text-cyan-400" />
          SPACECRAFT SPECIFICATIONS
        </h2>
        <p className="text-[11px] text-slate-400">
          Propulsion, mass properties, and aerodynamic ballistics
        </p>
      </div>

      {/* Vehicle Performance Dashboard HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Wet Mass</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {wetMass.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Dry: {spacecraft.dryMass.toLocaleString()} kg
          </span>
        </div>

        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Available Δv Budget</span>
          <span className="text-xl font-bold text-cyan-300 tabular-nums">
            {Math.round(deltaVAvailable).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">m/s</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Tsiolkovsky exact
          </span>
        </div>

        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fuel Remaining</span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums">
            {Math.round(spacecraft.fuelMass).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">kg</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {fuelPercent.toFixed(1)}% Capacity
          </span>
        </div>

        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Thrust-to-Weight (TWR)</span>
          <span className="text-xl font-bold text-amber-300 tabular-nums">
            {twr.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Max F: {spacecraft.maxThrust} N
          </span>
        </div>
      </div>

      {/* Editor Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-[11px] block">Spacecraft Name</label>
            <input
              type="text"
              value={spacecraft.name}
              onChange={(e) => onChangeSpacecraft({ ...spacecraft, name: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Model Architecture</label>
            <select
              value={spacecraft.modelType}
              onChange={(e) =>
                onChangeSpacecraft({
                  ...spacecraft,
                  modelType: e.target.value as SpacecraftConfig['modelType']
                })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            >
              <option value="SATELLITE">Standard Communications Satellite</option>
              <option value="CUBESAT">3U CubeSat Constellation</option>
              <option value="STATION">Orbital Space Station Modular</option>
              <option value="PROBE">Deep Space Exploration Probe</option>
            </select>
          </div>
        </div>

        {/* Mass & Fuel */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-[11px] block">Dry Mass (kg)</label>
            <input
              type="number"
              value={spacecraft.dryMass}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, dryMass: parseFloat(e.target.value) || 100 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Fuel Load (kg)</label>
            <input
              type="number"
              value={spacecraft.fuelMass}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, fuelMass: parseFloat(e.target.value) || 0 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Tank Capacity (kg)</label>
            <input
              type="number"
              value={spacecraft.fuelCapacity}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, fuelCapacity: parseFloat(e.target.value) || 100 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>
        </div>

        {/* Propulsion Parameters */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-[11px] block">Specific Impulse Isp (s)</label>
            <input
              type="number"
              value={spacecraft.isp}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, isp: parseFloat(e.target.value) || 200 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
            <span className="text-[10px] text-slate-500">Effective exhaust: {(spacecraft.isp * 9.81).toFixed(0)} m/s</span>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Maximum Thrust (N)</label>
            <input
              type="number"
              value={spacecraft.maxThrust}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, maxThrust: parseFloat(e.target.value) || 10 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Engine Classification</label>
            <input
              type="text"
              value={spacecraft.engineType}
              onChange={(e) => onChangeSpacecraft({ ...spacecraft, engineType: e.target.value })}
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            />
          </div>
        </div>

        {/* Aerodynamic & Radiation Ballistics */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-400 text-[11px] block">Cross-Section Area A (m²)</label>
            <input
              type="number"
              step="0.1"
              value={spacecraft.crossSectionArea}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, crossSectionArea: parseFloat(e.target.value) || 1 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Drag Coefficient Cd</label>
            <input
              type="number"
              step="0.05"
              value={spacecraft.dragCoefficient}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, dragCoefficient: parseFloat(e.target.value) || 2.2 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Solar Radiation Coeff Cr</label>
            <input
              type="number"
              step="0.05"
              value={spacecraft.solarRadiationCoeff}
              onChange={(e) =>
                onChangeSpacecraft({ ...spacecraft, solarRadiationCoeff: parseFloat(e.target.value) || 1.0 })
              }
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
