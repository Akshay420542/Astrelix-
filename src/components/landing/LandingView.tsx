/**
 * Landing Page & Product Overview
 * "Design. Simulate. Analyze. Navigate."
 */
import React from 'react';
import {
  Satellite,
  Compass,
  ArrowRight,
  ShieldCheck,
  Activity,
  Globe,
  Flame,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface LandingViewProps {
  onLaunchMissionControl: () => void;
  onExploreDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLaunchMissionControl,
  onExploreDemo
}) => {
  return (
    <div className="min-h-screen bg-[#04060a] text-slate-100 flex flex-col font-mono selection:bg-cyan-500/30 overflow-y-auto">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 bg-[#04060a]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Satellite className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white tracking-wider uppercase">
            PHYSICS-ACCURATE ORBITAL MISSION PLANNER
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExploreDemo}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded transition-colors"
          >
            EXPLORE DEMO
          </button>
          <button
            onClick={onLaunchMissionControl}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-all shadow-lg shadow-cyan-950/50"
          >
            <span>LAUNCH MISSION CONTROL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 max-w-6xl mx-auto flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 rounded-full text-xs font-medium tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          REAL-TIME SPACE MISSION SIMULATION & ANALYSIS PLATFORM
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white uppercase max-w-4xl text-balance">
          PHYSICS-ACCURATE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            ORBITAL MISSION PLANNER
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl text-balance font-normal">
          "Design. Simulate. Analyze. Navigate."
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl text-balance leading-relaxed">
          A high-fidelity space mission planning platform inspired by modern aerospace mission-control software. Design orbital transfers, calculate impulsive delta-v burns, simulate J2 perturbations and atmospheric drag, inspect live satellite ephemerides, and compute ground tracks.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            onClick={onLaunchMissionControl}
            className="w-full sm:w-auto px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg shadow-xl shadow-cyan-900/40 transition-all flex items-center justify-center gap-2"
          >
            <span>LAUNCH MISSION CONTROL</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>LOAD LEO → GEO DEMO</span>
          </button>
        </div>

        {/* Live Metrics Telemetry Ribbon */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 pt-12 text-left">
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Integrator Engine</span>
            <span className="text-lg font-bold text-white mt-1 block">Runge-Kutta 4th</span>
            <span className="text-[10px] text-cyan-400 mt-1 block">J2 oblateness + drag</span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Live Ephemerides</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">CelesTrak GP</span>
            <span className="text-[10px] text-slate-400 mt-1 block">ISS, HST, GPS, Starlink</span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Trajectory Solvers</span>
            <span className="text-lg font-bold text-amber-300 mt-1 block">Hohmann & Bi-Elliptic</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Exact Δv & mass budgets</span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Reference Frame</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">J2000 / ECI</span>
            <span className="text-[10px] text-slate-400 mt-1 block">WGS-84 coordinate model</span>
          </div>
        </div>
      </section>

      {/* Engineering Capabilities Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto space-y-8 border-t border-slate-800/60">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold uppercase text-white tracking-wider">
            MISSION PLANNING CAPABILITIES
          </h2>
          <p className="text-xs text-slate-400">
            Engineered for aerospace students, researchers, and mission designers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Realistic 3D Space Viewport</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Photorealistic WebGL Earth with atmospheric scattering, night-side city illuminations, dynamic cloud layers, Sun coronal flare, Moon, and solar system bodies.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2.5">
            <div className="w-8 h-8 rounded bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Orbital Maneuver Sequencer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan impulsive prograde, retrograde, normal, and radial burns. Real-time preview of new apoapsis, periapsis, and Tsiolkovsky propellant mass consumption.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2.5">
            <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Ground Track & Pass Predictor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compute 2D equirectangular ground tracks with Earth rotation angle correction. Predict ground station contact windows (AOS/LOS) and max elevation angles.
            </p>
          </div>
        </div>
      </section>

      {/* Scientific Integrity Disclaimer */}
      <footer className="mt-auto border-t border-slate-800/80 px-6 py-6 text-center text-[11px] text-slate-500 bg-[#030508]">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="text-slate-400">
            SCIENTIFIC HONESTY DISCLAIMER: Designed for education, research, and preliminary mission analysis.
          </p>
          <p>
            Physics-Accurate Orbital Mission Planner · Inspired by NASA/ESA mission control tools · Not certified flight software.
          </p>
        </div>
      </footer>
    </div>
  );
};
