/**
 * Maneuver Planner (Impulsive & Finite Burn Sequencer)
 */
import React, { useState } from 'react';
import { Flame, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { ManeuverNode, ManeuverType, Mission } from '../../types/mission';

interface ManeuverPlannerViewProps {
  mission: Mission;
  onChangeMission: (updated: Mission) => void;
  onRunSimulation: () => void;
}

export const ManeuverPlannerView: React.FC<ManeuverPlannerViewProps> = ({
  mission,
  onChangeMission,
  onRunSimulation
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    mission.maneuvers[0]?.id || ''
  );

  const totalDeltaV = mission.maneuvers
    .filter((m) => m.enabled)
    .reduce((sum, m) => sum + Math.abs(m.deltaV), 0);

  const totalFuelConsumed = mission.maneuvers
    .filter((m) => m.enabled)
    .reduce((sum, m) => sum + m.fuelConsumedKg, 0);

  const handleAddManeuver = () => {
    const nextOrder = mission.maneuvers.length + 1;
    const newNode: ManeuverNode = {
      id: `node-${Date.now().toString().slice(-4)}`,
      name: `Burn ${nextOrder} (Prograde)`,
      type: 'PROGRADE',
      deltaV: 150.0,
      vector: [150.0, 0, 0],
      trueAnomalyAtBurn: 0.0,
      burnEpochSeconds: 1800 * nextOrder,
      burnDurationSeconds: 45,
      fuelConsumedKg: 48.5,
      enabled: true
    };
    onChangeMission({
      ...mission,
      maneuvers: [...mission.maneuvers, newNode]
    });
    setSelectedNodeId(newNode.id);
  };

  const handleRemoveNode = (id: string) => {
    const updated = mission.maneuvers.filter((m) => m.id !== id);
    onChangeMission({ ...mission, maneuvers: updated });
    if (selectedNodeId === id && updated.length > 0) {
      setSelectedNodeId(updated[0].id);
    }
  };

  const handleUpdateNode = (id: string, partial: Partial<ManeuverNode>) => {
    const updated = mission.maneuvers.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, ...partial };
      // Recalculate fuel using Tsiolkovsky
      const g0 = 9.80665;
      const m0 = mission.spacecraft.dryMass + mission.spacecraft.fuelMass;
      next.fuelConsumedKg = Math.round(
        m0 * (1 - Math.exp(-Math.abs(next.deltaV) / (mission.spacecraft.isp * g0)))
      );
      return next;
    });
    onChangeMission({ ...mission, maneuvers: updated });
  };

  const selectedNode = mission.maneuvers.find((m) => m.id === selectedNodeId);

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            ORBITAL MANEUVER PLANNER
          </h2>
          <p className="text-[11px] text-slate-400">
            Impulsive & finite burns, delta-v budgeting, and trajectory vectors
          </p>
        </div>
        <button
          onClick={handleAddManeuver}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD BURN NODE</span>
        </button>
      </div>

      {/* Maneuver Summary Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Burn Δv</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums">
            {totalDeltaV.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Active nodes: {mission.maneuvers.filter((m) => m.enabled).length}
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Propellant Burned</span>
          <span className="text-xl font-bold text-slate-200 tabular-nums">
            {totalFuelConsumed.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Remaining: {Math.max(0, mission.spacecraft.fuelMass - totalFuelConsumed).toFixed(1)} kg
          </span>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mission Budget Feasibility</span>
          <span
            className={`text-xl font-bold tabular-nums ${
              totalFuelConsumed <= mission.spacecraft.fuelMass ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalFuelConsumed <= mission.spacecraft.fuelMass ? 'FEASIBLE' : 'DEFICIT'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            Capacity: {mission.spacecraft.fuelMass} kg
          </span>
        </div>
      </div>

      {/* Node List & Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Nodes Sidebar list */}
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-[11px] text-slate-400 uppercase tracking-wider">Maneuver Sequence</label>
          <div className="space-y-1">
            {mission.maneuvers.map((node, i) => (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-2.5 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                  selectedNodeId === node.id
                    ? 'bg-amber-950/40 border-amber-600 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <span className="text-slate-500 font-mono">#{i + 1}</span>
                    <span className="truncate max-w-[120px]">{node.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {node.type} · {node.deltaV.toFixed(1)} m/s
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={node.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleUpdateNode(node.id, { enabled: e.target.checked });
                    }}
                    className="accent-amber-500"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNode(node.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Editor */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-4">
          {selectedNode ? (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-white uppercase">{selectedNode.name}</span>
                <span className="text-[10px] text-slate-500">ID: {selectedNode.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[11px] block">Burn Direction Type</label>
                  <select
                    value={selectedNode.type}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, {
                        type: e.target.value as ManeuverType
                      })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="PROGRADE">PROGRADE (+V Vector)</option>
                    <option value="RETROGRADE">RETROGRADE (-V Vector)</option>
                    <option value="NORMAL">NORMAL (+H Angular Momentum)</option>
                    <option value="ANTI_NORMAL">ANTI-NORMAL (-H Angular Momentum)</option>
                    <option value="RADIAL_IN">RADIAL IN (-R Toward Central Body)</option>
                    <option value="RADIAL_OUT">RADIAL OUT (+R Away From Body)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block">Burn Impulse Δv (m/s)</label>
                  <input
                    type="number"
                    step="1"
                    value={selectedNode.deltaV}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, {
                        deltaV: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-slate-400 text-[11px] block">Burn Epoch (s from launch)</label>
                  <input
                    type="number"
                    step="10"
                    value={selectedNode.burnEpochSeconds}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, {
                        burnEpochSeconds: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
                  />
                  <span className="text-[10px] text-slate-500">
                    T+{(selectedNode.burnEpochSeconds / 60).toFixed(1)} minutes
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block">True Anomaly at Burn (deg)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={selectedNode.trueAnomalyAtBurn}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, {
                        trueAnomalyAtBurn: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white tabular-nums"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded border border-slate-800 text-[11px] flex justify-between items-center">
                <div>
                  <span className="text-slate-400">Estimated Propellant Mass: </span>
                  <span className="text-amber-300 font-semibold">{selectedNode.fuelConsumedKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400">Burn Duration: </span>
                  <span className="text-cyan-300 font-semibold">{selectedNode.burnDurationSeconds} s</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select or add a maneuver node to configure burn parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
