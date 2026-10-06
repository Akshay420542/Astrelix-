/**
 * Interactive Ground Station & RF Link-Budget Mapping
 * Calculates Free Space Path Loss (FSPL), EIRP, Eb/N0, C/N0, and link closure margins.
 */
import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  Signal,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe,
  Sliders,
  Sparkles
} from 'lucide-react';
import { LinkBudgetCalculation, RfFrequencyBand } from '../../types/advancedFeatures';
import { GROUND_STATIONS } from '../../data/groundStations';
import { computeRfLinkBudget } from '../../physics/advancedPropagators';

export const LinkBudgetView: React.FC = () => {
  const [selectedBand, setSelectedBand] = useState<RfFrequencyBand>('X_BAND');
  const [distanceKm, setDistanceKm] = useState<number>(1250.0);
  const [elevationDeg, setElevationDeg] = useState<number>(24.0);
  const [txPowerWatts, setTxPowerWatts] = useState<number>(25.0);
  const [antennaGainDbi, setAntennaGainDbi] = useState<number>(28.5);
  const [dataRateMbps, setDataRateMbps] = useState<number>(150.0);
  const [selectedStationCode, setSelectedStationCode] = useState<string>('KSC');

  const linkResult: LinkBudgetCalculation = computeRfLinkBudget(
    selectedBand,
    distanceKm,
    elevationDeg,
    txPowerWatts,
    antennaGainDbi,
    dataRateMbps
  );

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            GROUND STATION RF TELEMETRY & LINK-BUDGET MAPPING
          </h2>
          <p className="text-[11px] text-slate-400">
            Carrier-to-noise C/N₀, energy-per-bit Eb/N₀, and Friis path-loss margin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              linkResult.linkStatus === 'CLOSED_NOMINAL'
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                : linkResult.linkStatus === 'DEGRADED_MARGIN'
                ? 'bg-amber-950/70 text-amber-400 border-amber-800'
                : 'bg-rose-950/70 text-rose-400 border-rose-800'
            }`}
          >
            ● LINK STATUS: {linkResult.linkStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Primary Link Margin Dashboard HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Link Margin (Eb/N0 - Req)</span>
          <span
            className={`text-2xl font-bold tabular-nums ${
              linkResult.linkMarginDb >= 3.0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            +{linkResult.linkMarginDb.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">dB</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Min requirement: +3.0 dB
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Carrier-to-Noise C/N₀</span>
          <span className="text-2xl font-bold text-cyan-300 tabular-nums">
            {linkResult.receivedCarrierToNoiseDbHz.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">dB-Hz</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">At ground receiver demod</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Free-Space Path Loss (FSPL)</span>
          <span className="text-2xl font-bold text-amber-300 tabular-nums">
            -{linkResult.freeSpacePathLossDb.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">dB</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Distance: {distanceKm.toLocaleString()} km
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Downlink EIRP</span>
          <span className="text-2xl font-bold text-slate-200 tabular-nums">
            {linkResult.eirpDbw.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">dBW</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Tx Power: {txPowerWatts} W
          </span>
        </div>
      </div>

      {/* RF Frequency Band Selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
          COMMUNICATION FREQUENCY SPECTRUM
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'S_BAND', label: 'S-Band (2.25 GHz)', desc: 'TT&C Telemetry / Low-Rate Command' },
            { id: 'X_BAND', label: 'X-Band (8.45 GHz)', desc: 'Mission Payload Telemetry Standard' },
            { id: 'KA_BAND', label: 'Ka-Band (26.5 GHz)', desc: 'High-Throughput Deep Space Science' },
            { id: 'OPTICAL_LASER', label: 'Optical (1550 nm)', desc: 'Laser Comm Terminal (Gigabit Class)' }
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBand(b.id as any)}
              className={`p-2.5 rounded border text-left transition-colors ${
                selectedBand === b.id
                  ? 'bg-cyan-950/70 border-cyan-600 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="font-bold text-white text-xs">{b.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* RF & Geometric Sliders */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
        <span className="text-white font-semibold uppercase text-[11px] block pb-2 border-b border-slate-800">
          RF LINK BUDGET SLIDERS & PARAMETER CONTROLS
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Slant Range Distance d (km)</span>
              <span className="text-white tabular-nums font-semibold">{distanceKm} km</span>
            </div>
            <input
              type="range"
              min="300"
              max="45000"
              step="100"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
              className="w-full mt-2 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Ground Station Elevation (deg)</span>
              <span className="text-white tabular-nums font-semibold">{elevationDeg}°</span>
            </div>
            <input
              type="range"
              min="2"
              max="90"
              step="1"
              value={elevationDeg}
              onChange={(e) => setElevationDeg(parseFloat(e.target.value))}
              className="w-full mt-2 accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Downlink Data Rate (Mbps)</span>
              <span className="text-white tabular-nums font-semibold">{dataRateMbps} Mbps</span>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              step="10"
              value={dataRateMbps}
              onChange={(e) => setDataRateMbps(parseFloat(e.target.value))}
              className="w-full mt-2 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="text-slate-400 text-[11px] block">Transmitter RF Output Power (Watts)</label>
            <input
              type="number"
              step="5"
              value={txPowerWatts}
              onChange={(e) => setTxPowerWatts(parseFloat(e.target.value) || 5)}
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block">Spacecraft Antenna Gain (dBi)</label>
            <input
              type="number"
              step="0.5"
              value={antennaGainDbi}
              onChange={(e) => setAntennaGainDbi(parseFloat(e.target.value) || 10)}
              className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white tabular-nums"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
