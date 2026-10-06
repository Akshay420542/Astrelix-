/**
 * Collaborative Multi-Agency Workspaces & Digital Thread
 * Manages agency permissions, digital review locks, CAD/propulsion lineage, and cryptographic artifact hashes.
 */
import React, { useState } from 'react';
import {
  Users,
  Shield,
  Lock,
  CheckCircle2,
  GitCommit,
  Layers,
  FileCheck,
  Building2,
  Clock,
  KeyRound,
  FileCode,
  Share2
} from 'lucide-react';
import { DigitalThreadItem, SpaceAgency } from '../../types/advancedFeatures';
import { Mission } from '../../types/mission';

interface DigitalThreadWorkspaceViewProps {
  mission: Mission;
}

export const DigitalThreadWorkspaceView: React.FC<DigitalThreadWorkspaceViewProps> = ({
  mission
}) => {
  const [activeAgency, setActiveAgency] = useState<SpaceAgency>('NASA');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const [auditLog, setAuditLog] = useState<DigitalThreadItem[]>([
    {
      id: 'dt-001',
      timestampUtc: '2026-10-05T18:30:00Z',
      agency: 'NASA',
      operator: 'Flight Dynamics Officer (FDO)',
      category: 'TRAJECTORY_BASELINE',
      title: 'Baseline Hohmann Transfer Profile Approved',
      hash: 'sha256:7f9a2b89c4e12d4a5b6c8d7e9f0a1b2c3d4e5f6a',
      status: 'VERIFIED',
      details: 'Mission initial trajectory parameters locked and digitally signed by NASA JSC Astrodynamics division.'
    },
    {
      id: 'dt-002',
      timestampUtc: '2026-10-05T19:15:22Z',
      agency: 'ESA',
      operator: 'ESOC Trajectory Analyst',
      category: 'PROPULSION_REVISION',
      title: 'Chemical Hydrazine Bi-Propellant ISP Validated',
      hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
      status: 'VERIFIED',
      details: 'Engine vacuum specific impulse Isp verified at 320.0s against hot-fire test bench telemetry.'
    },
    {
      id: 'dt-003',
      timestampUtc: '2026-10-05T20:00:10Z',
      agency: 'USSF',
      operator: '18th Space Defense Squadron Liaison',
      category: 'CAM_AUTHORIZED',
      title: 'Space Domain Awareness Pre-Conjunction Screening Pass',
      hash: 'sha256:4a8b1c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
      status: 'VERIFIED',
      details: 'Trajectory screened against 18th SDS high-accuracy catalog with zero conjunctions exceeding Pc threshold 1e-4.'
    },
    {
      id: 'dt-004',
      timestampUtc: '2026-10-05T21:10:45Z',
      agency: 'COMMERCIAL_NEWSPACE',
      operator: 'Launch Vehicle Payload Integrator',
      category: 'CAD_GEOMETRY',
      title: 'Cross-Sectional Aerodynamic Area Model Rev. 4',
      hash: 'sha256:9f8e7d6c5b4a3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
      status: 'VERIFIED',
      details: 'Solar panel deployment envelope locked at 4.20 m² cross-section with Cd drag coefficient 2.20.'
    },
    {
      id: 'dt-005',
      timestampUtc: '2026-10-05T21:45:00Z',
      agency: 'NASA',
      operator: 'Mission Director Flight Readiness Review',
      category: 'SAFETY_SIGNOFF',
      title: 'Digital Thread Artifact Gate L-24h Cleared',
      hash: 'sha256:2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
      status: 'VERIFIED',
      details: 'All stakeholder agencies approved active baseline. State vector locks engaged.'
    }
  ]);

  const agencies: { id: SpaceAgency; name: string; jurisdiction: string; clearance: string }[] = [
    { id: 'NASA', name: 'NASA', jurisdiction: 'Civil Space Operations', clearance: 'CO-LEAD / TIER 1' },
    { id: 'ESA', name: 'ESA', jurisdiction: 'European Space Operations Centre', clearance: 'PARTNER / TIER 1' },
    { id: 'JAXA', name: 'JAXA', jurisdiction: 'Tsukuba Space Center', clearance: 'COLLABORATOR / TIER 2' },
    { id: 'ISRO', name: 'ISRO', jurisdiction: 'ISTRAC Telemetry Network', clearance: 'COLLABORATOR / TIER 2' },
    { id: 'USSF', name: 'USSF', jurisdiction: 'Space Domain Awareness & Defense', clearance: 'SDA CLEARANCE / TIER 1' },
    { id: 'COMMERCIAL_NEWSPACE', name: 'Commercial', jurisdiction: 'Payload Integration & Providers', clearance: 'COMMERCIAL / TIER 3' }
  ];

  const filteredLogs = auditLog.filter(
    (item) =>
      (activeAgency === 'NASA' || item.agency === activeAgency) &&
      (filterCategory === 'ALL' || item.category === filterCategory)
  );

  return (
    <div className="p-4 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            COLLABORATIVE MULTI-AGENCY WORKSPACE & DIGITAL THREAD
          </h2>
          <p className="text-[11px] text-slate-400">
            Cryptographic artifact lineage, agency clearances, and model review gates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 rounded flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            STATE VECTOR LOCKED
          </span>
        </div>
      </div>

      {/* Agency Clearance Selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider block">
          SELECT PARTICIPATING AGENCY WORKSPACE
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {agencies.map((agency) => (
            <button
              key={agency.id}
              onClick={() => setActiveAgency(agency.id)}
              className={`p-2 rounded border text-left transition-colors ${
                activeAgency === agency.id
                  ? 'bg-cyan-950/70 border-cyan-600 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="font-bold text-white text-xs">{agency.name}</div>
              <div className="text-[9px] text-slate-500 truncate mt-0.5">{agency.clearance}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Digital Thread Lineage Artifact Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-semibold text-white uppercase text-[11px] flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
            MISSION DIGITAL THREAD & ARTIFACT REVISION LOG
          </span>
          <span className="text-[10px] text-slate-400">
            {filteredLogs.length} Cryptographically Sealed Items
          </span>
        </div>

        {/* Audit Log Table */}
        <div className="space-y-2">
          {filteredLogs.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950 rounded border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-900 text-cyan-300 border border-slate-700 rounded">
                    {item.agency}
                  </span>
                  <span className="font-semibold text-slate-200 text-xs">{item.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {item.status}
                  </span>
                  <span>{new Date(item.timestampUtc).toLocaleTimeString()} UTC</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{item.details}</p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                <span>By: {item.operator}</span>
                <span className="text-slate-500 font-mono text-[9px] truncate max-w-[280px]">
                  {item.hash}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
