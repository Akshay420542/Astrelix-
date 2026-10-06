/**
 * High-Fidelity Multi-Body & Non-Keplerian Propagators
 * NASA GMAT / Orekit architecture: J2, J3, J4 zonal harmonics, Lunar/Solar 3rd-body gravity & SRP.
 */
import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sun,
  Moon,
  Wind,
  CheckCircle2,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { MultiBodyConfig } from '../../types/advancedFeatures';
import { Mission } from '../../types/mission';
import {
  J2_EARTH,
  J3_EARTH,
  J4_EARTH,
  calculateHighOrderZonalAcceleration,
  calculateThirdBodyAcceleration,
  calculateSolarRadiationPressureAcceleration
} from '../../physics/advancedPropagators';

interface HighFidelityPropagatorViewProps {
  mission: Mission;
  onChangeMission: (updated: Mission) => void;
  onRunSimulation: () => void;
}

export const HighFidelityPropagatorView: React.FC<HighFidelityPropagatorViewProps> = ({
  mission,
  onChangeMission,
  onRunSimulation
}) => {
  const [config, setConfig] = useState<MultiBodyConfig>({
    gravityModel: 'J2_J3_J4_ZONAL',
    j2Enabled: true,
    j3Enabled: true,
    j4Enabled: true,
    includeLunarThirdBody: true,
    includeSolarThirdBody: true,
    includeSolarRadiationPressure: true,
    srpReflectivityCoeff: 1.3,
    includeAtmosphericDrag: true,
    dragAtmosphereModel: 'EXPONENTIAL_STANDARD',
    integratorEngine: 'OREKIT_DORMAND_PRINCE_853',
    toleranceError: 1e-10
  });

  // Calculate sample perturbation accelerations for inspection
  const rSample: [number, number, number] = [6778.14, 0, 0];
  const aHarmonics = calculateHighOrderZonalAcceleration(
    rSample,
    config.j2Enabled,
    config.j3Enabled,
    config.j4Enabled
  );
  const aThirdBody = calculateThirdBodyAcceleration(
    rSample,
    0,
    config.includeLunarThirdBody,
    config.includeSolarThirdBody
  );
  const aSrp = calculateSolarRadiationPressureAcceleration(
    rSample,
    mission.spacecraft.dryMass + mission.spacecraft.fuelMass,
    mission.spacecraft.crossSectionArea,
    config.srpReflectivityCoeff
  );

  const aHarmonicsMag = Math.sqrt(
    aHarmonics[0] * aHarmonics[0] + aHarmonics[1] * aHarmonics[1] + aHarmonics[2] * aHarmonics[2]
  ) * 1000; // m/s^2

  const aThirdBodyMag = Math.sqrt(
    aThirdBody[0] * aThirdBody[0] + aThirdBody[1] * aThirdBody[1] + aThirdBody[2] * aThirdBody[2]
  ) * 1000; // m/s^2

  const aSrpMag = Math.sqrt(
    aSrp[0] * aSrp[0] + aSrp[1] * aSrp[1] + aSrp[2] * aSrp[2]
  ) * 1000; // m/s^2

  const handleApplyConfig = () => {
    onChangeMission({
      ...mission,
      fidelity: config.includeLunarThirdBody ? 'HIGH_FIDELITY_NBODY' : 'ADVANCED_J2_DRAG'
    });
    onRunSimulation();
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            HIGH-FIDELITY MULTI-BODY & NON-KEPLERIAN PROPAGATOR
          </h2>
          <p className="text-[11px] text-slate-400">
            NASA GMAT / Orekit numerical mechanics with high-order gravity harmonics & N-body forces
          </p>
        </div>
        <button
          onClick={handleApplyConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>APPLY TO NUMERICAL SOLVER</span>
        </button>
      </div>

      {/* Perturbation Force Accels Preview HUD */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">High-Order Harmonics (J2-J4)</span>
          <span className="text-lg font-bold text-cyan-300 tabular-nums">
            {aHarmonicsMag.toExponential(3)} <span className="text-xs text-slate-400 font-normal">m/s²</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Oblateness + Pear asymmetry</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">3rd-Body Gravity (Moon & Sun)</span>
          <span className="text-lg font-bold text-amber-300 tabular-nums">
            {aThirdBodyMag.toExponential(3)} <span className="text-xs text-slate-400 font-normal">m/s²</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Point-mass lunar/solar tides</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Solar Radiation Pressure (SRP)</span>
          <span className="text-lg font-bold text-slate-200 tabular-nums">
            {aSrpMag.toExponential(3)} <span className="text-xs text-slate-400 font-normal">m/s²</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Photon momentum flux at 1 AU</span>
        </div>
      </div>

      {/* Numerical Engine Selection */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
        <span className="text-white font-semibold uppercase text-[11px] block">
          ASTRODYNAMICS NUMERICAL INTEGRATION ARCHITECTURE
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            {
              id: 'OREKIT_DORMAND_PRINCE_853',
              title: 'Orekit / Dormand-Prince 8(5,3)',
              desc: 'Adaptive step high-order embedded Runge-Kutta'
            },
            {
              id: 'RUNGE_KUTTA_4',
              title: 'Standard Runge-Kutta 4 (RK4)',
              desc: 'Fixed timestep 4th-order orbital integrator'
            },
            {
              id: 'RUNGE_KUTTA_FEHLBERG_78',
              title: 'NASA GMAT / RKF78',
              desc: 'Fehlberg 7th/8th order scientific standard'
            }
          ].map((eng) => (
            <button
              key={eng.id}
              onClick={() => setConfig({ ...config, integratorEngine: eng.id as any })}
              className={`p-2.5 rounded border text-left transition-colors ${
                config.integratorEngine === eng.id
                  ? 'bg-cyan-950/70 border-cyan-600 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="font-semibold text-white text-xs">{eng.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{eng.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Perturbation Layers Configuration Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
        <span className="text-white font-semibold uppercase text-[11px] block pb-2 border-b border-slate-800">
          PHYSICAL PERTURBATION ACCELERATION FORCES
        </span>

        <div className="space-y-2.5">
          {/* Earth Zonal Harmonics */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-semibold text-white text-xs">
                  Earth Zonal Geopotential Harmonics (J2, J3, J4)
                </span>
                <p className="text-[10px] text-slate-400">
                  Accounts for equatorial bulge (J2={J2_EARTH.toExponential(2)}), pear-shape (J3), and higher octupole (J4).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={config.j2Enabled}
                  onChange={(e) => setConfig({ ...config, j2Enabled: e.target.checked })}
                  className="accent-cyan-500"
                />
                <span>J2</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={config.j3Enabled}
                  onChange={(e) => setConfig({ ...config, j3Enabled: e.target.checked })}
                  className="accent-cyan-500"
                />
                <span>J3</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={config.j4Enabled}
                  onChange={(e) => setConfig({ ...config, j4Enabled: e.target.checked })}
                  className="accent-cyan-500"
                />
                <span>J4</span>
              </label>
            </div>
          </div>

          {/* Lunar Third Body */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-slate-300" />
              <div>
                <span className="font-semibold text-white text-xs">
                  Lunar Third-Body Point-Mass Gravitation
                </span>
                <p className="text-[10px] text-slate-400">
                  Calculates gravitational tidal forces from Moon (μ = 4,902.8 km³/s² at 384,400 km).
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.includeLunarThirdBody}
              onChange={(e) => setConfig({ ...config, includeLunarThirdBody: e.target.checked })}
              className="accent-cyan-500"
            />
          </div>

          {/* Solar Third Body */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-semibold text-white text-xs">
                  Solar Third-Body Point-Mass Gravitation
                </span>
                <p className="text-[10px] text-slate-400">
                  Ecliptic heliocentric gravitational pull from Sun (μ = 1.327×10¹¹ km³/s² at 1 AU).
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.includeSolarThirdBody}
              onChange={(e) => setConfig({ ...config, includeSolarThirdBody: e.target.checked })}
              className="accent-cyan-500"
            />
          </div>

          {/* Solar Radiation Pressure */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <div>
                <span className="font-semibold text-white text-xs">
                  Cannonball Solar Radiation Pressure (SRP)
                </span>
                <p className="text-[10px] text-slate-400">
                  Photon momentum flux: P₀ = 4.56 μN/m², Cr = {config.srpReflectivityCoeff}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>Cr:</span>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="2.0"
                  value={config.srpReflectivityCoeff}
                  onChange={(e) =>
                    setConfig({ ...config, srpReflectivityCoeff: parseFloat(e.target.value) || 1.2 })
                  }
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white"
                />
              </div>
              <input
                type="checkbox"
                checked={config.includeSolarRadiationPressure}
                onChange={(e) =>
                  setConfig({ ...config, includeSolarRadiationPressure: e.target.checked })
                }
                className="accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
