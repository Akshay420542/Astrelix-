/**
 * Timeline Controls & Viewport Camera Controls Bar
 */
import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Camera,
  Layers,
  FastForward
} from 'lucide-react';
import { CameraViewMode, ScaleMode } from '../3d/SpaceScene';

interface TimelineControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  timeWarp: number;
  onSetTimeWarp: (warp: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  cameraView: CameraViewMode;
  onSetCameraView: (view: CameraViewMode) => void;
  scaleMode: ScaleMode;
  onSetScaleMode: (scale: ScaleMode) => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  showOtherSatellites: boolean;
  onToggleOtherSatellites: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPlaying,
  onTogglePlay,
  timeWarp,
  onSetTimeWarp,
  onStepForward,
  onStepBackward,
  cameraView,
  onSetCameraView,
  scaleMode,
  onSetScaleMode,
  showOrbits,
  onToggleOrbits,
  showOtherSatellites,
  onToggleOtherSatellites
}) => {
  const warpSpeeds = [1, 10, 100, 1000, 10000, 100000];

  return (
    <div className="h-12 border-t border-slate-800 bg-[#070a12]/95 backdrop-blur-md px-4 flex items-center justify-between text-xs font-mono select-none z-20 shrink-0">
      {/* Simulation Playback Transport */}
      <div className="flex items-center gap-2">
        <button
          onClick={onStepBackward}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-800 transition-colors"
          title="Step Backward (10s)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-all ${
            isPlaying
              ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
              : 'bg-cyan-600/90 hover:bg-cyan-500 text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          onClick={onStepForward}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-800 transition-colors"
          title="Step Forward (10s)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Warp Multipliers */}
        <div className="flex items-center gap-1 ml-2 p-1 bg-slate-900 rounded border border-slate-800">
          <FastForward className="w-3 h-3 text-slate-500 ml-1 mr-0.5" />
          {warpSpeeds.map((w) => (
            <button
              key={w}
              onClick={() => onSetTimeWarp(w)}
              className={`px-2 py-0.5 rounded text-[10px] tabular-nums font-semibold transition-colors ${
                timeWarp === w
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {w >= 1000 ? `${w / 1000}kx` : `${w}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Camera View Switcher */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-slate-900 rounded border border-slate-800">
        <Camera className="w-3.5 h-3.5 text-slate-500 mx-1.5" />
        {(['ORBIT', 'FOLLOW', 'EARTH', 'SOLAR', 'TOP', 'PLANE'] as CameraViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => onSetCameraView(v)}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
              cameraView === v
                ? 'bg-slate-700 text-cyan-300 font-semibold border border-slate-600'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Layer Toggles & Scale */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleOrbits}
            className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
              showOrbits
                ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            ORBITS
          </button>

          <button
            onClick={onToggleOtherSatellites}
            className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
              showOtherSatellites
                ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            CATALOG
          </button>
        </div>

        {/* Scale Mode */}
        <select
          value={scaleMode}
          onChange={(e) => onSetScaleMode(e.target.value as ScaleMode)}
          aria-label="Visualization Scale Mode"
          className="bg-slate-900 text-slate-300 border border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-500"
        >
          <option value="REAL">REAL SCALE</option>
          <option value="MISSION">MISSION SCALE</option>
          <option value="EARTH_CENTRIC">EARTH-CENTRIC</option>
          <option value="SOLAR">SOLAR SCALE</option>
        </select>
      </div>
    </div>
  );
};
