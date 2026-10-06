/**
 * 2D Equirectangular Ground Track Map & Visibility Footprint
 */
import React, { useState } from 'react';
import { Globe, Crosshair, MapPin } from 'lucide-react';
import { GroundStation, TrajectoryPoint } from '../../types/mission';
import { GROUND_STATIONS } from '../../data/groundStations';

interface GroundTrackViewProps {
  trajectory: TrajectoryPoint[];
  simulationTime: number; // s
}

export const GroundTrackView: React.FC<GroundTrackViewProps> = ({
  trajectory,
  simulationTime
}) => {
  const [orbitsToShow, setOrbitsToShow] = useState<number>(1);

  // Find active sub-satellite point
  const currentPt =
    trajectory.length > 0
      ? trajectory.reduce((prev, curr) =>
          Math.abs(curr.timeSec - simulationTime) < Math.abs(prev.timeSec - simulationTime) ? curr : prev
        )
      : null;

  // Map dimensions
  const mapWidth = 900;
  const mapHeight = 450;

  // Convert (lon, lat) to canvas (x, y)
  const lonLatToXY = (lon: number, lat: number) => {
    const x = ((lon + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  };

  // Slice trajectory according to selected orbits (~5400s per orbit)
  const maxTime = orbitsToShow * 5600;
  const visiblePoints = trajectory.filter((p) => p.timeSec <= maxTime);

  // Group continuous paths to avoid wrapping lines across the 180/-180 boundary
  const paths: string[] = [];
  let currentPath: string[] = [];

  for (let i = 0; i < visiblePoints.length; i++) {
    const pt = visiblePoints[i];
    const { x, y } = lonLatToXY(pt.lon, pt.lat);

    if (currentPath.length === 0) {
      currentPath.push(`M ${x} ${y}`);
    } else {
      const prevPt = visiblePoints[i - 1];
      // Check if wrapped around anti-meridian
      if (Math.abs(pt.lon - prevPt.lon) > 180) {
        paths.push(currentPath.join(' '));
        currentPath = [`M ${x} ${y}`];
      } else {
        currentPath.push(`L ${x} ${y}`);
      }
    }
  }
  if (currentPath.length > 0) {
    paths.push(currentPath.join(' '));
  }

  const subSatXY = currentPt ? lonLatToXY(currentPt.lon, currentPt.lat) : null;

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            2D EQUIRECTANGULAR GROUND TRACK
          </h2>
          <p className="text-[11px] text-slate-400">
            Sub-satellite track projection, equator intersection & ground stations
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Projection:</span>
          {[1, 2, 5].map((o) => (
            <button
              key={o}
              onClick={() => setOrbitsToShow(o)}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                orbitsToShow === o
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {o} Orbit{o > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full overflow-hidden bg-[#060c18] border border-slate-800 rounded-lg">
        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-auto">
          {/* Subtle continent outlines in stylized SVG */}
          <rect width={mapWidth} height={mapHeight} fill="#060c18" />

          {/* Equator & Lat/Lon Graticule */}
          {[ -60, -30, 0, 30, 60 ].map((lat) => {
            const y = ((90 - lat) / 180) * mapHeight;
            return (
              <line
                key={`lat-${lat}`}
                x1={0}
                y1={y}
                x2={mapWidth}
                y2={y}
                stroke={lat === 0 ? '#38bdf8' : '#1e293b'}
                strokeWidth={lat === 0 ? '1.5' : '0.5'}
                strokeDasharray={lat === 0 ? 'none' : '4 4'}
              />
            );
          })}

          {[ -120, -60, 0, 60, 120 ].map((lon) => {
            const x = ((lon + 180) / 360) * mapWidth;
            return (
              <line
                key={`lon-${lon}`}
                x1={x}
                y1={0}
                x2={x}
                y2={mapHeight}
                stroke={lon === 0 ? '#38bdf8' : '#1e293b'}
                strokeWidth={lon === 0 ? '1.5' : '0.5'}
                strokeDasharray={lon === 0 ? 'none' : '4 4'}
              />
            );
          })}

          {/* Continental landmass silhouettes */}
          {/* North America */}
          <path
            d="M 120 70 L 250 80 L 290 140 L 260 210 L 200 190 L 160 140 Z"
            fill="#0f223a"
            stroke="#1e3a5f"
            strokeWidth="0.8"
          />
          {/* South America */}
          <path
            d="M 270 240 L 340 270 L 330 380 L 280 410 L 260 300 Z"
            fill="#0f223a"
            stroke="#1e3a5f"
            strokeWidth="0.8"
          />
          {/* Eurasia */}
          <path
            d="M 450 70 L 760 90 L 780 180 L 650 200 L 520 180 L 460 120 Z"
            fill="#0f223a"
            stroke="#1e3a5f"
            strokeWidth="0.8"
          />
          {/* Africa */}
          <path
            d="M 440 180 L 550 190 L 540 330 L 480 340 L 420 240 Z"
            fill="#0f223a"
            stroke="#1e3a5f"
            strokeWidth="0.8"
          />
          {/* Australia */}
          <path
            d="M 720 280 L 820 290 L 800 370 L 710 350 Z"
            fill="#0f223a"
            stroke="#1e3a5f"
            strokeWidth="0.8"
          />

          {/* Ground Station markers */}
          {GROUND_STATIONS.map((gs) => {
            const { x, y } = lonLatToXY(gs.longitude, gs.latitude);
            return (
              <g key={gs.id}>
                <circle cx={x} cy={y} r="3" fill="#10b981" />
                <text
                  x={x + 5}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {gs.code}
                </text>
              </g>
            );
          })}

          {/* Ground Track Trajectory Paths */}
          {paths.map((d, i) => (
            <path
              key={`track-${i}`}
              d={d}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
              opacity="0.85"
            />
          ))}

          {/* Sub-Satellite Point Marker with Visibility Footprint */}
          {subSatXY && (
            <g>
              {/* Footprint cone circle */}
              <circle
                cx={subSatXY.x}
                cy={subSatXY.y}
                r="36"
                fill="rgba(6, 182, 212, 0.12)"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={subSatXY.x} cy={subSatXY.y} r="4.5" fill="#f59e0b" />
              <circle
                cx={subSatXY.x}
                cy={subSatXY.y}
                r="8"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1"
                className="animate-ping"
              />
              <text
                x={subSatXY.x + 10}
                y={subSatXY.y - 8}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                TARGET SAT
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
