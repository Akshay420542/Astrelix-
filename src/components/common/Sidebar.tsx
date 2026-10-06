/**
 * Sidebar Navigation (Mission Control Navigation Drawer)
 */
import React from 'react';
import {
  Compass,
  Satellite,
  Rocket,
  CircleDot,
  Flame,
  ArrowRightLeft,
  Activity,
  Globe,
  Eye,
  BarChart2,
  GitCompare,
  CheckCircle2,
  Database,
  Layers,
  ShieldAlert,
  Cpu,
  Radio,
  AlertOctagon,
  Users,
  Bot,
  MapPin
} from 'lucide-react';

export type ActiveTab =
  | 'mission'
  | 'satellites'
  | 'spacecraft'
  | 'orbits'
  | 'maneuvers'
  | 'transfers'
  | 'sda'
  | 'propagators'
  | 'linkbudget'
  | 'contingency'
  | 'digitalthread'
  | 'telemetry'
  | 'groundtrack'
  | 'visibility'
  | 'analysis'
  | 'scenarios'
  | 'validation'
  | 'datasources'
  | 'aichat'
  | 'mapsgrounding';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen
}) => {
  const navItems = [
    { id: 'mission', label: 'Mission', icon: Compass, kicker: '01' },
    { id: 'aichat', label: 'Gemini AI Chat', icon: Bot, kicker: 'AI' },
    { id: 'mapsgrounding', label: 'Maps Grounding', icon: MapPin, kicker: 'GEO' },
    { id: 'satellites', label: 'Satellites', icon: Satellite, kicker: '02' },
    { id: 'spacecraft', label: 'Spacecraft', icon: Rocket, kicker: '03' },
    { id: 'orbits', label: 'Orbits', icon: CircleDot, kicker: '04' },
    { id: 'maneuvers', label: 'Maneuvers', icon: Flame, kicker: '05' },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft, kicker: '06' },
    { id: 'sda', label: 'SDA & Conjunctions', icon: ShieldAlert, kicker: '07' },
    { id: 'propagators', label: 'Multi-Body Physics', icon: Cpu, kicker: '08' },
    { id: 'linkbudget', label: 'RF Link Budget', icon: Radio, kicker: '09' },
    { id: 'contingency', label: 'Contingency Solver', icon: AlertOctagon, kicker: '10' },
    { id: 'digitalthread', label: 'Multi-Agency Thread', icon: Users, kicker: '11' },
    { id: 'telemetry', label: 'Telemetry', icon: Activity, kicker: '12' },
    { id: 'groundtrack', label: 'Ground Track', icon: Globe, kicker: '13' },
    { id: 'visibility', label: 'Visibility Passes', icon: Eye, kicker: '14' },
    { id: 'analysis', label: 'Mission Analysis', icon: BarChart2, kicker: '15' },
    { id: 'scenarios', label: 'Scenarios', icon: GitCompare, kicker: '16' },
    { id: 'validation', label: 'Validation', icon: CheckCircle2, kicker: '17' },
    { id: 'datasources', label: 'Data Sources', icon: Database, kicker: '18' }
  ];

  return (
    <aside
      className={`border-r border-slate-800 bg-[#07090e]/95 backdrop-blur-md flex flex-col shrink-0 transition-all duration-200 z-10 ${
        isOpen ? 'w-56' : 'w-16'
      }`}
    >
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          {isOpen && <span>CONTROLS</span>}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono transition-all text-left ${
                isActive
                  ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {isOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{item.kicker}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {isOpen && (
        <div className="p-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex flex-col gap-1">
          <div className="flex justify-between">
            <span>ENGINE:</span>
            <span className="text-cyan-400">OREKIT / GMAT</span>
          </div>
          <div className="flex justify-between">
            <span>REFERENCE:</span>
            <span className="text-slate-400">J2000 / ECI</span>
          </div>
        </div>
      )}
    </aside>
  );
};
