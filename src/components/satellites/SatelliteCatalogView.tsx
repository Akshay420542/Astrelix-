/**
 * Searchable Satellite Catalog & Ephemeris Inspector
 */
import React, { useState } from 'react';
import { Satellite, Search, Eye, Radio, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SatelliteRecord } from '../../types/mission';

interface SatelliteCatalogViewProps {
  satellites: SatelliteRecord[];
  selectedSatellite: SatelliteRecord | null;
  onSelectSatellite: (sat: SatelliteRecord | null) => void;
  onAdoptOrbitAsMission: (sat: SatelliteRecord) => void;
}

export const SatelliteCatalogView: React.FC<SatelliteCatalogViewProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  onAdoptOrbitAsMission
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = [
    'ALL',
    'CREWED',
    'EARTH_OBSERVATION',
    'NAVIGATION',
    'COMMUNICATION',
    'WEATHER',
    'SCIENTIFIC'
  ];

  const filteredSatellites = satellites.filter((sat) => {
    const matchesSearch =
      sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sat.noradId.toString().includes(searchQuery) ||
      sat.intlDesignator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sat.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' || sat.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            SATELLITE EPHEMERIS CATALOG
          </h2>
          <p className="text-[11px] text-slate-400">
            Real orbital data sourced via CelesTrak & NASA Horizons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Total Tracked:</span>
          <span className="text-cyan-300 font-semibold">{satellites.length} objects</span>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by satellite name, NORAD ID, or international code..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-semibold transition-colors whitespace-nowrap ${
                categoryFilter === c
                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-700'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Satellite Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
        {filteredSatellites.map((sat) => {
          const isSelected = selectedSatellite?.id === sat.id;
          return (
            <div
              key={sat.id}
              onClick={() => onSelectSatellite(sat)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-xs flex items-center gap-2">
                    {sat.name}
                    <span className="text-[10px] text-slate-400 font-normal">
                      #{sat.noradId}
                    </span>
                  </h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">{sat.country}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      sat.dataStatus === 'LIVE'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950/60 text-amber-400 border-amber-800'
                    }`}
                  >
                    ● {sat.dataStatus}
                  </span>
                </div>
              </div>

              {/* Orbital Telemetry Grid */}
              <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Altitude</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {sat.altitudeKm.toFixed(1)} km
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Velocity</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {sat.speedKms.toFixed(2)} km/s
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Period</span>
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {sat.periodMinutes.toFixed(1)} min
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Inclination</span>
                  <span className="text-slate-300 tabular-nums">
                    {sat.elements.i.toFixed(2)}°
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Eccentricity</span>
                  <span className="text-slate-300 tabular-nums">
                    {sat.elements.e.toFixed(5)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Method</span>
                  <span className="text-cyan-400">{sat.propagationMethod}</span>
                </div>
              </div>

              {/* TLE Preview if selected */}
              {isSelected && (
                <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>SOURCE: {sat.dataSource}</span>
                    <span>EPOCH: {sat.lastUpdatedUtc}</span>
                  </div>
                  <pre className="text-[9px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 overflow-x-auto">
                    {sat.tleLine1}
                    {'\n'}
                    {sat.tleLine2}
                  </pre>
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdoptOrbitAsMission(sat);
                      }}
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold transition-colors"
                    >
                      ADOPT ORBIT INTO MISSION
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
