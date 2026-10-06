/**
 * Visibility & Ground Station Pass Prediction View
 */
import React, { useState } from 'react';
import { Eye, Radio, MapPin, Clock, Calendar, CheckCircle } from 'lucide-react';
import { GroundStation, SatellitePass, TrajectoryPoint } from '../../types/mission';
import { GROUND_STATIONS } from '../../data/groundStations';
import { predictPasses } from '../../physics/groundTrack';

interface PassPredictionViewProps {
  trajectory: TrajectoryPoint[];
}

export const PassPredictionView: React.FC<PassPredictionViewProps> = ({ trajectory }) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(GROUND_STATIONS[0].id);
  const [minElevationDeg, setMinElevationDeg] = useState<number>(5.0);

  const selectedStation =
    GROUND_STATIONS.find((gs) => gs.id === selectedStationId) || GROUND_STATIONS[0];

  const passes: SatellitePass[] = predictPasses(
    trajectory,
    selectedStation,
    minElevationDeg
  );

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            GROUND STATION VISIBILITY & PASS PREDICTOR
          </h2>
          <p className="text-[11px] text-slate-400">
            Acquisition of Signal (AOS), Loss of Signal (LOS) & Horizon Elevation
          </p>
        </div>
      </div>

      {/* Station Selector & Constraints */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-[11px] block">Select Ground Station</label>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
          >
            {GROUND_STATIONS.map((gs) => (
              <option key={gs.id} value={gs.id}>
                {gs.name} ({gs.code}) · {gs.latitude > 0 ? `${gs.latitude}°N` : `${-gs.latitude}°S`},{' '}
                {gs.longitude > 0 ? `${gs.longitude}°E` : `${-gs.longitude}°W`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 text-[11px] block">Horizon Elevation Mask (deg)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="45"
            value={minElevationDeg}
            onChange={(e) => setMinElevationDeg(parseFloat(e.target.value) || 5)}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
          />
          <span className="text-[10px] text-slate-500">Minimum antenna tracking angle</span>
        </div>
      </div>

      {/* Passes Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <span className="font-semibold text-white uppercase">
            UPCOMING SATELLITE PASSES ({passes.length})
          </span>
          <span className="text-cyan-400">{selectedStation.name}</span>
        </div>

        {passes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No passes above {minElevationDeg}° elevation mask found within simulated trajectory window.
            Extend simulation duration to search further passes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase bg-slate-950/30">
                  <th className="p-2.5">Pass #</th>
                  <th className="p-2.5">AOS (UTC)</th>
                  <th className="p-2.5">LOS (UTC)</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Max Elevation</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {passes.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-semibold text-slate-300">#{idx + 1}</td>
                    <td className="p-2.5 text-slate-200 tabular-nums">{p.aosUtc}</td>
                    <td className="p-2.5 text-slate-200 tabular-nums">{p.losUtc}</td>
                    <td className="p-2.5 text-cyan-300 tabular-nums">{p.durationMinutes} min</td>
                    <td className="p-2.5 text-amber-300 font-semibold tabular-nums">
                      {p.maxElevationDeg}°
                    </td>
                    <td className="p-2.5">
                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800/80 rounded">
                        PREDICTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
