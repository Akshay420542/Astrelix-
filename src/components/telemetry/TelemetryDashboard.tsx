/**
 * Scientific Telemetry Dashboard & Time-Series Graphing
 */
import React, { useState } from 'react';
import { Activity, Gauge, TrendingUp, Zap, Fuel, Globe } from 'lucide-react';
import { Mission, TrajectoryPoint } from '../../types/mission';

interface TelemetryDashboardProps {
  mission: Mission;
  trajectory: TrajectoryPoint[];
  simulationTime: number; // s
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  mission,
  trajectory,
  simulationTime
}) => {
  const [activeMetric, setActiveMetric] = useState<'altitude' | 'speed' | 'energy'>('altitude');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Find nearest trajectory point for current simulation time
  const currentPoint =
    trajectory.length > 0
      ? trajectory.reduce((prev, curr) =>
          Math.abs(curr.timeSec - simulationTime) < Math.abs(prev.timeSec - simulationTime) ? curr : prev
        )
      : null;

  // Render SVG Chart for active metric
  const renderChart = () => {
    if (!trajectory || trajectory.length < 2) {
      return (
        <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
          No telemetry points propagated. Click "RUN SIMULATION" to generate data.
        </div>
      );
    }

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 30, left: 60 };

    let values: number[] = [];
    let unit = 'km';
    let label = 'Altitude';

    if (activeMetric === 'altitude') {
      values = trajectory.map((p) => p.altitude);
      unit = 'km';
      label = 'Orbital Altitude';
    } else if (activeMetric === 'speed') {
      values = trajectory.map((p) => p.speed);
      unit = 'km/s';
      label = 'Inertial Velocity';
    } else {
      values = trajectory.map((p) => p.energy);
      unit = 'MJ/kg';
      label = 'Specific Mechanical Energy';
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const points = trajectory.map((p, i) => {
      const x =
        padding.left +
        (i / (trajectory.length - 1)) * (width - padding.left - padding.right);
      const y =
        height -
        padding.bottom -
        ((values[i] - minVal) / range) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    }).join(' ');

    const hoverPt =
      hoverIndex !== null && hoverIndex < trajectory.length
        ? {
            p: trajectory[hoverIndex],
            val: values[hoverIndex],
            x:
              padding.left +
              (hoverIndex / (trajectory.length - 1)) *
                (width - padding.left - padding.right),
            y:
              height -
              padding.bottom -
              ((values[hoverIndex] - minVal) / range) *
                (height - padding.top - padding.bottom)
          }
        : null;

    return (
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 bg-slate-950 rounded-lg border border-slate-800"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.min(
              trajectory.length - 1,
              Math.max(0, Math.floor(relX * trajectory.length))
            );
            setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Subtle grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={padding.left}
            y1={height / 2}
            x2={width - padding.right}
            y2={height / 2}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#334155"
          />

          {/* Axes labels */}
          <text
            x={padding.left - 8}
            y={padding.top + 4}
            fill="#94a3b8"
            fontSize="10"
            textAnchor="end"
            fontFamily="monospace"
          >
            {maxVal.toFixed(1)} {unit}
          </text>
          <text
            x={padding.left - 8}
            y={height - padding.bottom}
            fill="#94a3b8"
            fontSize="10"
            textAnchor="end"
            fontFamily="monospace"
          >
            {minVal.toFixed(1)} {unit}
          </text>

          {/* Polyline curve */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            points={points}
          />

          {/* Hover Crosshair & Tooltip */}
          {hoverPt && (
            <g>
              <line
                x1={hoverPt.x}
                y1={padding.top}
                x2={hoverPt.x}
                y2={height - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={hoverPt.x} cy={hoverPt.y} r="4" fill="#38bdf8" />
              <rect
                x={Math.min(width - 150, hoverPt.x + 10)}
                y={hoverPt.y - 30}
                width="140"
                height="32"
                fill="#0f172a"
                stroke="#38bdf8"
                rx="4"
              />
              <text
                x={Math.min(width - 150, hoverPt.x + 10) + 8}
                y={hoverPt.y - 18}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {hoverPt.val.toFixed(2)} {unit}
              </text>
              <text
                x={Math.min(width - 150, hoverPt.x + 10) + 8}
                y={hoverPt.y - 6}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
              >
                T+{(hoverPt.p.timeSec / 60).toFixed(1)} min
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            TELEMETRY & DYNAMICS DASHBOARD
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-time orbital altitude, velocity, and state vector history
          </p>
        </div>
      </div>

      {/* Real-time State Vector HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Altitude</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {currentPoint ? currentPoint.altitude.toFixed(1) : '---'} <span className="text-xs font-normal text-slate-400">km</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Above WGS-84 ellipsoid</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Orbital Speed</span>
          <span className="text-xl font-bold text-cyan-300 tabular-nums">
            {currentPoint ? currentPoint.speed.toFixed(3) : '---'} <span className="text-xs font-normal text-slate-400">km/s</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {currentPoint ? (currentPoint.speed * 3600).toFixed(0) : '---'} km/h
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sub-Satellite Point</span>
          <span className="text-base font-bold text-slate-200 tabular-nums">
            {currentPoint ? `${currentPoint.lat.toFixed(1)}°, ${currentPoint.lon.toFixed(1)}°` : '---'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Geodetic Lat / Lon</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mechanical Energy</span>
          <span className="text-xl font-bold text-amber-300 tabular-nums">
            {currentPoint ? currentPoint.energy.toFixed(2) : '---'} <span className="text-xs font-normal text-slate-400">MJ/kg</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Specific energy ε</span>
        </div>
      </div>

      {/* Chart Selector Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => setActiveMetric('altitude')}
          className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeMetric === 'altitude'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Altitude vs Time
        </button>

        <button
          onClick={() => setActiveMetric('speed')}
          className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeMetric === 'speed'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Velocity vs Time
        </button>

        <button
          onClick={() => setActiveMetric('energy')}
          className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeMetric === 'energy'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Specific Energy vs Time
        </button>
      </div>

      {/* Telemetry Chart Area */}
      {renderChart()}
    </div>
  );
};
