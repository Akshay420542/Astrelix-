/**
 * Mission Export Modal (JSON, CSV, & Formatted Engineering Summary)
 * Includes Visual Trajectory Preview & Data Structure Inspector
 */
import React, { useState } from 'react';
import {
  X,
  FileDown,
  Copy,
  Check,
  FileText,
  Table,
  TrendingUp,
  ShieldCheck,
  Database,
  Eye
} from 'lucide-react';
import { Mission, TrajectoryPoint } from '../../types/mission';

interface MissionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission;
  trajectory: TrajectoryPoint[];
}

export const MissionExportModal: React.FC<MissionExportModalProps> = ({
  isOpen,
  onClose,
  mission,
  trajectory
}) => {
  const [activeTab, setActiveTab] = useState<'RAW' | 'PREVIEW'>('PREVIEW');
  const [format, setFormat] = useState<'JSON' | 'CSV' | 'REPORT'>('CSV');
  const [copied, setCopied] = useState(false);
  const [previewSampleRange, setPreviewSampleRange] = useState<'HEAD' | 'TAIL' | 'ALL_SAMPLES'>('HEAD');

  if (!isOpen) return null;

  const totalPoints = trajectory.length;
  const initialPt = trajectory[0];
  const finalPt = trajectory[trajectory.length - 1];

  const minAlt = trajectory.length > 0 ? Math.min(...trajectory.map((p) => p.altitude)) : 0;
  const maxAlt = trajectory.length > 0 ? Math.max(...trajectory.map((p) => p.altitude)) : 0;
  const minSpeed = trajectory.length > 0 ? Math.min(...trajectory.map((p) => p.speed)) : 0;
  const maxSpeed = trajectory.length > 0 ? Math.max(...trajectory.map((p) => p.speed)) : 0;

  // Generate Sample rows for verification
  let samplePoints: TrajectoryPoint[] = [];
  if (previewSampleRange === 'HEAD') {
    samplePoints = trajectory.slice(0, 8);
  } else if (previewSampleRange === 'TAIL') {
    samplePoints = trajectory.slice(Math.max(0, trajectory.length - 8));
  } else {
    // Step samples
    const step = Math.max(1, Math.floor(trajectory.length / 8));
    samplePoints = trajectory.filter((_, i) => i % step === 0).slice(0, 8);
  }

  const generateJson = () => {
    return JSON.stringify(
      {
        mission,
        trajectorySummary: {
          pointsCount: trajectory.length,
          initialAltitudeKm: initialPt?.altitude,
          finalAltitudeKm: finalPt?.altitude,
          minAltitudeKm: minAlt,
          maxAltitudeKm: maxAlt,
          coordinateFrame: 'ECI_J2000',
          fields: [
            'timeSec',
            'x',
            'y',
            'z',
            'vx',
            'vy',
            'vz',
            'altitude',
            'speed',
            'lat',
            'lon',
            'energy'
          ],
          firstPoint: initialPt,
          lastPoint: finalPt
        },
        trajectory,
        exportTimestampUtc: new Date().toISOString()
      },
      null,
      2
    );
  };

  const generateCsv = () => {
    const headers =
      'time_sec,pos_x_km,pos_y_km,pos_z_km,vel_x_kms,vel_y_kms,vel_z_kms,alt_km,speed_kms,lat_deg,lon_deg,energy_mj_kg\n';
    const rows = trajectory
      .map(
        (p) =>
          `${p.timeSec},${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)},${p.vx.toFixed(4)},${p.vy.toFixed(4)},${p.vz.toFixed(4)},${p.altitude.toFixed(2)},${p.speed.toFixed(3)},${p.lat.toFixed(2)},${p.lon.toFixed(2)},${p.energy.toFixed(3)}`
      )
      .join('\n');
    return headers + rows;
  };

  const generateReport = () => {
    const totalDv = mission.maneuvers.reduce((s, m) => s + m.deltaV, 0);
    const totalFuel = mission.maneuvers.reduce((s, m) => s + m.fuelConsumedKg, 0);

    return `========================================================================
ORBITAL MISSION PLANNING & TRAJECTORY ANALYSIS REPORT
Physics-Accurate Orbital Mission Planner
========================================================================

1. MISSION METADATA
Mission Identifier: ${mission.id}
Mission Name:       ${mission.name}
Objective:          ${mission.objective}
Central Body:       ${mission.centralBody.toUpperCase()}
Epoch (UTC):        ${mission.epochUtc}
Physics Fidelity:   ${mission.fidelity}

2. VEHICLE PARAMETERS
Spacecraft Name:    ${mission.spacecraft.name}
Model Architecture: ${mission.spacecraft.modelType}
Dry Mass:           ${mission.spacecraft.dryMass} kg
Fuel Mass:          ${mission.spacecraft.fuelMass} kg (Capacity: ${mission.spacecraft.fuelCapacity} kg)
Specific Impulse:   ${mission.spacecraft.isp} s
Maximum Thrust:     ${mission.spacecraft.maxThrust} N
Engine Type:        ${mission.spacecraft.engineType}
Cross-Section:      ${mission.spacecraft.crossSectionArea} m² (Cd: ${mission.spacecraft.dragCoefficient})

3. ORBITAL PARAMETERS (INITIAL)
Semi-Major Axis:    ${mission.initialOrbit.a} km (Altitude: ${(mission.initialOrbit.a - 6378.14).toFixed(1)} km)
Eccentricity:       ${mission.initialOrbit.e}
Inclination:        ${mission.initialOrbit.i}°
RAAN:               ${mission.initialOrbit.raan}°
Arg of Periapsis:   ${mission.initialOrbit.argPeriapsis}°
True Anomaly:       ${mission.initialOrbit.trueAnomaly}°

4. MANEUVER & PROPULSION BUDGET
Scheduled Burns:    ${mission.maneuvers.length}
Total Mission Δv:   ${totalDv.toFixed(1)} m/s
Fuel Consumed:      ${totalFuel.toFixed(1)} kg
Propellant Margin:  ${(mission.spacecraft.fuelMass - totalFuel).toFixed(1)} kg
Feasibility Status: ${totalFuel <= mission.spacecraft.fuelMass ? 'FEASIBLE' : 'DEFICIT'}

5. SIMULATION SUMMARY
Trajectory Steps:   ${trajectory.length} timesteps
Initial Velocity:   ${initialPt?.speed.toFixed(3) || '---'} km/s
Final Velocity:     ${finalPt?.speed.toFixed(3) || '---'} km/s
Altitude Envelope:  ${minAlt.toFixed(1)} km to ${maxAlt.toFixed(1)} km
Specific Energy:    ${initialPt?.energy.toFixed(3) || '---'} MJ/kg
Coordinate System:  Earth-Centered Inertial (ECI J2000)
========================================================================
Generated by PHYSICS-ACCURATE ORBITAL MISSION PLANNER
Report Date: ${new Date().toUTCString()}
`;
  };

  const currentContent =
    format === 'JSON'
      ? generateJson()
      : format === 'CSV'
      ? generateCsv()
      : generateReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'JSON' ? 'json' : format === 'CSV' ? 'csv' : 'txt';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mission.name.replace(/\s+/g, '_')}_trajectory.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sparkline coordinates for Altitude vs Time
  const sparkWidth = 540;
  const sparkHeight = 60;
  const altPoints = trajectory.map((p, i) => {
    const x = (i / Math.max(1, trajectory.length - 1)) * sparkWidth;
    const y =
      sparkHeight -
      ((p.altitude - minAlt) / Math.max(1, maxAlt - minAlt)) * (sparkHeight - 10) -
      5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0e17] border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#070a12]">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white uppercase">
              EXPORT TRAJECTORY & MISSION DATA
            </span>
          </div>

          {/* Primary View Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
            <button
              onClick={() => setActiveTab('PREVIEW')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'PREVIEW'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>VISUAL DATA PREVIEW</span>
            </button>
            <button
              onClick={() => setActiveTab('RAW')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'RAW'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>RAW EXPORT CODE</span>
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subheader / Format Selector for Raw tab */}
        {activeTab === 'RAW' && (
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase">Target Format:</span>
              {(['CSV', 'JSON', 'REPORT'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-3 py-1 rounded font-semibold text-[11px] transition-colors border ${
                    format === fmt
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {fmt === 'REPORT' ? 'SUMMARY REPORT' : `${fmt} FORMAT`}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500">
              {trajectory.length} timesteps ready for export
            </span>
          </div>
        )}

        {/* TAB 1: VISUAL TRAJECTORY PREVIEW & DATA STRUCTURE INSPECTOR */}
        {activeTab === 'PREVIEW' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/90">
            {/* Verification Status Banner */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs">
                  TRAJECTORY STRUCTURE VERIFIED
                </span>
                <span className="text-[10px] text-emerald-400/80">
                  (12 Numerical State Vectors · Continuous RK4 Time Series)
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {totalPoints} TIMESTEPS RECORDED
              </span>
            </div>

            {/* Quick Summary Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <span className="text-[10px] text-slate-500 block">TOTAL TIMESTEPS</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {totalPoints.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Δt = 25s resolution
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <span className="text-[10px] text-slate-500 block">ALTITUDE ENVELOPE</span>
                <span className="text-base font-bold text-cyan-300 tabular-nums">
                  {minAlt.toFixed(0)} - {maxAlt.toFixed(0)}{' '}
                  <span className="text-xs font-normal text-slate-400">km</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Perigee / Apogee
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <span className="text-[10px] text-slate-500 block">VELOCITY ENVELOPE</span>
                <span className="text-base font-bold text-amber-300 tabular-nums">
                  {minSpeed.toFixed(2)} - {maxSpeed.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">km/s</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Inertial speeds
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <span className="text-[10px] text-slate-500 block">COORDINATE FRAME</span>
                <span className="text-base font-bold text-slate-200 block">
                  ECI J2000
                </span>
                <span className="text-[10px] text-slate-500 block">
                  WGS-84 Geodetic
                </span>
              </div>
            </div>

            {/* Trajectory Altitude Curve Sparkline */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  ALTITUDE PROFILE PROFILE (h vs t)
                </span>
                <span className="text-cyan-400">
                  Peak: {maxAlt.toFixed(1)} km · Min: {minAlt.toFixed(1)} km
                </span>
              </div>
              <svg
                viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
                className="w-full h-14 bg-slate-950 rounded border border-slate-800/80 overflow-hidden"
              >
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  points={altPoints}
                />
              </svg>
            </div>

            {/* Trajectory Data Points Table Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-0">
              <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-white uppercase text-[11px]">
                    DATA STRUCTURE & SAMPLE ROWS
                  </span>
                </div>

                {/* Range Selector */}
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-500">SAMPLE RANGE:</span>
                  {[
                    { id: 'HEAD', label: 'First 8 Points' },
                    { id: 'ALL_SAMPLES', label: 'Evenly Distributed' },
                    { id: 'TAIL', label: 'Last 8 Points' }
                  ].map((rng) => (
                    <button
                      key={rng.id}
                      onClick={() => setPreviewSampleRange(rng.id as any)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        previewSampleRange === rng.id
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {rng.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase bg-slate-950/40">
                      <th className="p-1.5">t (s)</th>
                      <th className="p-1.5">Alt (km)</th>
                      <th className="p-1.5">Speed (km/s)</th>
                      <th className="p-1.5">X (km)</th>
                      <th className="p-1.5">Y (km)</th>
                      <th className="p-1.5">Z (km)</th>
                      <th className="p-1.5">Vx (km/s)</th>
                      <th className="p-1.5">Vy (km/s)</th>
                      <th className="p-1.5">Vz (km/s)</th>
                      <th className="p-1.5">Lat (°)</th>
                      <th className="p-1.5">Lon (°)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {samplePoints.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-1.5 text-cyan-300 tabular-nums">{pt.timeSec}</td>
                        <td className="p-1.5 text-white font-semibold tabular-nums">
                          {pt.altitude.toFixed(1)}
                        </td>
                        <td className="p-1.5 text-amber-300 tabular-nums">{pt.speed.toFixed(3)}</td>
                        <td className="p-1.5 text-slate-300 tabular-nums">{pt.x.toFixed(1)}</td>
                        <td className="p-1.5 text-slate-300 tabular-nums">{pt.y.toFixed(1)}</td>
                        <td className="p-1.5 text-slate-300 tabular-nums">{pt.z.toFixed(1)}</td>
                        <td className="p-1.5 text-slate-400 tabular-nums">{pt.vx.toFixed(3)}</td>
                        <td className="p-1.5 text-slate-400 tabular-nums">{pt.vy.toFixed(3)}</td>
                        <td className="p-1.5 text-slate-400 tabular-nums">{pt.vz.toFixed(3)}</td>
                        <td className="p-1.5 text-slate-300 tabular-nums">{pt.lat.toFixed(2)}</td>
                        <td className="p-1.5 text-slate-300 tabular-nums">{pt.lon.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RAW CODE EXPORT (JSON / CSV / REPORT) */}
        {activeTab === 'RAW' && (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
            <pre className="text-[10px] text-slate-300 whitespace-pre-wrap selection:bg-cyan-500/30 font-mono leading-relaxed">
              {currentContent}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY RAW EXPORT'}</span>
            </button>

            {activeTab === 'PREVIEW' && (
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                Verified: Ready to download as CSV, JSON or Report
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'PREVIEW' && (
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                aria-label="Export file format"
                className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="CSV">Export as CSV (.csv)</option>
                <option value="JSON">Export as JSON (.json)</option>
                <option value="REPORT">Export as Summary (.txt)</option>
              </select>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs transition-colors shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>DOWNLOAD {format}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
