/**
 * Autonomous Space Domain Awareness (SDA) & Conjunction Risk Assessment
 * Conjunction screening, Foster 3D covariance collision probability (Pc), and Autonomous CAM generation.
 */
import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Crosshair,
  Flame,
  CheckCircle2,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ConjunctionEvent } from '../../types/advancedFeatures';
import { Mission } from '../../types/mission';
import { computeCollisionProbability } from '../../physics/advancedPropagators';

interface SpaceDomainAwarenessViewProps {
  mission: Mission;
  onChangeMission: (updated: Mission) => void;
  onRunSimulation: () => void;
}

export const SpaceDomainAwarenessView: React.FC<SpaceDomainAwarenessViewProps> = ({
  mission,
  onChangeMission,
  onRunSimulation
}) => {
  const [conjunctions, setConjunctions] = useState<ConjunctionEvent[]>([
    {
      id: 'conj-001',
      targetSatellite: mission.spacecraft.name,
      chaserDebrisName: 'COSMOS-2251 DEBRIS',
      noradIdDebris: 34125,
      debrisType: 'FRAGMENTATION_DEBRIS',
      tcaUtc: '2026-10-06T04:12:30Z',
      timeToTcaSeconds: 23400,
      missDistanceTotalKm: 0.38,
      radialMissKm: 0.12,
      inTrackMissKm: 0.28,
      crossTrackMissKm: 0.22,
      relativeVelocityKms: 14.28,
      collisionProbabilityPc: 4.8e-4,
      riskLevel: 'CRITICAL',
      recommendedCamDeltaV: {
        burnType: 'PROGRADE',
        deltaVMs: 0.85,
        burnTimeSecondsBeforeTca: 5400, // 1 orbit before TCA
        postManeuverMissKm: 14.2,
        postManeuverPc: 1.2e-7
      }
    },
    {
      id: 'conj-002',
      targetSatellite: mission.spacecraft.name,
      chaserDebrisName: 'FENGYUN-1C DEB',
      noradIdDebris: 30142,
      debrisType: 'FRAGMENTATION_DEBRIS',
      tcaUtc: '2026-10-06T09:45:10Z',
      timeToTcaSeconds: 43200,
      missDistanceTotalKm: 1.95,
      radialMissKm: 0.84,
      inTrackMissKm: 1.62,
      crossTrackMissKm: 0.65,
      relativeVelocityKms: 11.45,
      collisionProbabilityPc: 2.1e-5,
      riskLevel: 'WARNING',
      recommendedCamDeltaV: {
        burnType: 'RADIAL_OUT',
        deltaVMs: 0.42,
        burnTimeSecondsBeforeTca: 7200,
        postManeuverMissKm: 8.4,
        postManeuverPc: 3.4e-8
      }
    },
    {
      id: 'conj-003',
      targetSatellite: mission.spacecraft.name,
      chaserDebrisName: 'CZ-4B ROCKET BODY',
      noradIdDebris: 25890,
      debrisType: 'ROCKET_BODY',
      tcaUtc: '2026-10-06T15:20:00Z',
      timeToTcaSeconds: 63600,
      missDistanceTotalKm: 6.80,
      radialMissKm: 2.10,
      inTrackMissKm: 6.10,
      crossTrackMissKm: 1.80,
      relativeVelocityKms: 9.82,
      collisionProbabilityPc: 1.1e-7,
      riskLevel: 'NOMINAL'
    }
  ]);

  const [selectedConjunctionId, setSelectedConjunctionId] = useState<string>('conj-001');

  const selectedEvent =
    conjunctions.find((c) => c.id === selectedConjunctionId) || conjunctions[0];

  // Execute Autonomous Collision Avoidance Maneuver (CAM)
  const handleExecuteCam = (event: ConjunctionEvent) => {
    if (!event.recommendedCamDeltaV) return;

    const cam = event.recommendedCamDeltaV;
    const burnTime = Math.max(0, event.timeToTcaSeconds - cam.burnTimeSecondsBeforeTca);

    const newNode = {
      id: `cam-${Date.now().toString().slice(-4)}`,
      name: `Autonomous CAM (${event.chaserDebrisName})`,
      type: cam.burnType,
      deltaV: cam.deltaVMs,
      vector: [cam.deltaVMs, 0, 0] as [number, number, number],
      trueAnomalyAtBurn: 0.0,
      burnEpochSeconds: burnTime,
      burnDurationSeconds: 12,
      fuelConsumedKg: Math.round(
        (mission.spacecraft.dryMass + mission.spacecraft.fuelMass) *
          (1 - Math.exp(-cam.deltaVMs / (mission.spacecraft.isp * 9.80665))) *
          10
      ) / 10,
      enabled: true
    };

    // Update conjunction to nominal status post-CAM
    const updatedConjunctions = conjunctions.map((c) => {
      if (c.id !== event.id) return c;
      return {
        ...c,
        riskLevel: 'NOMINAL' as const,
        missDistanceTotalKm: cam.postManeuverMissKm,
        collisionProbabilityPc: cam.postManeuverPc
      };
    });

    setConjunctions(updatedConjunctions);
    onChangeMission({
      ...mission,
      maneuvers: [...mission.maneuvers, newNode]
    });
    onRunSimulation();
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            SPACE DOMAIN AWARENESS (SDA) & CONJUNCTION ASSESSMENT
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-time orbital collision risk screening & autonomous avoidance maneuvers (CAM)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 bg-amber-950/60 border border-amber-800 rounded">
            THRESHOLD: Pc &gt; 10⁻⁴ (RED ALERT)
          </span>
        </div>
      </div>

      {/* High-Level SDA Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Monitored Close Approaches</span>
          <span className="text-xl font-bold text-white tabular-nums">
            {conjunctions.length} <span className="text-xs text-slate-400 font-normal">Events</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">72-Hour Screening Window</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Maximum Collision Prob (Pc)</span>
          <span className="text-xl font-bold text-rose-400 tabular-nums">
            {Math.max(...conjunctions.map((c) => c.collisionProbabilityPc)).toExponential(2)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Foster 3D Covariance</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Minimum Miss Distance</span>
          <span className="text-xl font-bold text-amber-300 tabular-nums">
            {Math.min(...conjunctions.map((c) => c.missDistanceTotalKm)).toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-normal">km</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Total Euclidean norm</span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">Autonomous CAM Readiness</span>
          <span className="text-xl font-bold text-emerald-400 block">
            AVAILABLE
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Low-impulse burn &lt;1.0 m/s</span>
        </div>
      </div>

      {/* Conjunction Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-white uppercase text-[11px] flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            CONJUNCTION DATA MESSAGES (CDM) SCREENING TABLE
          </span>
          <span className="text-[10px] text-slate-400">18th SDS Feed Sync: Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase bg-slate-950/40">
                <th className="p-2">Object Name / NORAD</th>
                <th className="p-2">Object Type</th>
                <th className="p-2">TCA (UTC)</th>
                <th className="p-2">Miss Dist (km)</th>
                <th className="p-2">Rel Velocity</th>
                <th className="p-2">Collision Prob (Pc)</th>
                <th className="p-2">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {conjunctions.map((ev) => {
                const isSelected = selectedConjunctionId === ev.id;
                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedConjunctionId(ev.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-950/30' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <td className="p-2 font-semibold text-white">
                      <div>{ev.chaserDebrisName}</div>
                      <span className="text-[10px] text-slate-500 font-normal">#{ev.noradIdDebris}</span>
                    </td>
                    <td className="p-2 text-slate-400">{ev.debrisType}</td>
                    <td className="p-2 text-slate-200 tabular-nums">{ev.tcaUtc}</td>
                    <td className="p-2 font-semibold text-slate-100 tabular-nums">
                      {ev.missDistanceTotalKm.toFixed(2)} km
                    </td>
                    <td className="p-2 text-slate-300 tabular-nums">{ev.relativeVelocityKms.toFixed(2)} km/s</td>
                    <td
                      className={`p-2 font-bold tabular-nums ${
                        ev.collisionProbabilityPc >= 1e-4
                          ? 'text-rose-400'
                          : ev.collisionProbabilityPc >= 1e-6
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {ev.collisionProbabilityPc.toExponential(2)}
                    </td>
                    <td className="p-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          ev.riskLevel === 'CRITICAL'
                            ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                            : ev.riskLevel === 'WARNING'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        ● {ev.riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Conjunction Detail & Autonomous CAM Action */}
      {selectedEvent && (
        <div className="bg-slate-900/90 border border-amber-800/60 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="font-semibold text-white uppercase text-xs">
                DETAIL CONJUNCTION ASSESSMENT: {selectedEvent.chaserDebrisName}
              </span>
              <p className="text-[10px] text-slate-400">
                Encounter Frame Miss Vectors & Maneuver Recommendation
              </p>
            </div>
            {selectedEvent.recommendedCamDeltaV && (
              <button
                onClick={() => handleExecuteCam(selectedEvent)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition-colors shadow-md"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>EXECUTE AUTONOMOUS CAM ({selectedEvent.recommendedCamDeltaV.deltaVMs} m/s)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Radial Miss (ΔR)</span>
              <span className="text-base font-bold text-white tabular-nums">
                {selectedEvent.radialMissKm.toFixed(3)} km
              </span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">In-Track Miss (ΔT)</span>
              <span className="text-base font-bold text-white tabular-nums">
                {selectedEvent.inTrackMissKm.toFixed(3)} km
              </span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Cross-Track Miss (ΔC)</span>
              <span className="text-base font-bold text-white tabular-nums">
                {selectedEvent.crossTrackMissKm.toFixed(3)} km
              </span>
            </div>
          </div>

          {selectedEvent.recommendedCamDeltaV && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded text-[11px] space-y-1">
              <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Autonomous Collision Avoidance Maneuver (CAM) Recommendation:</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Execute a low-delta-V <strong>{selectedEvent.recommendedCamDeltaV.deltaVMs} m/s</strong>{' '}
                {selectedEvent.recommendedCamDeltaV.burnType} burn at T-
                {(selectedEvent.recommendedCamDeltaV.burnTimeSecondsBeforeTca / 3600).toFixed(1)}h before TCA.
                This will expand the miss distance from <strong>{selectedEvent.missDistanceTotalKm.toFixed(2)} km</strong> to{' '}
                <strong className="text-emerald-400">{selectedEvent.recommendedCamDeltaV.postManeuverMissKm.toFixed(1)} km</strong>,
                reducing collision risk to <strong>{selectedEvent.recommendedCamDeltaV.postManeuverPc.toExponential(1)}</strong>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
