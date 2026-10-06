/**
 * Top Navigation Bar (Zone 1: Title, Zone 2: System Status & Time, Zone 3: Actions)
 */
import React from 'react';
import {
  Satellite,
  Radio,
  Play,
  RotateCcw,
  Sparkles,
  Command,
  FileDown,
  Mic,
  Bot,
  Cloud,
  User as UserIcon
} from 'lucide-react';
import { SystemStatus } from '../../api/apiClient';

interface HeaderProps {
  systemStatus: SystemStatus;
  simulationTime: number; // s
  utcDateString: string;
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  onResetSimulation: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onOpenLanding: () => void;
  onOpenVoiceComms?: () => void;
  onOpenCloudSync?: () => void;
  onOpenAIChat?: () => void;
  currentUser?: any;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  simulationTime,
  utcDateString,
  onOpenCommandPalette,
  onOpenExportModal,
  onResetSimulation,
  onRunSimulation,
  isSimulating,
  onOpenLanding,
  onOpenVoiceComms,
  onOpenCloudSync,
  onOpenAIChat,
  currentUser
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#070a12]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Zone 1: Brand & Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenLanding}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-2">
              ORBITAL MISSION PLANNER
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 rounded">
                SIM v2.4
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              REAL-TIME TRAJECTORY ENGINE
            </p>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Telemetry & Status Badges */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
        {/* UTC Clock */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400">SIM TIME:</span>
          <span className="text-cyan-300 tabular-nums font-semibold">{utcDateString}</span>
        </div>

        {/* MET (Mission Elapsed Time) */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400">MET:</span>
          <span className="text-emerald-400 tabular-nums font-semibold">
            T+{Math.floor(simulationTime / 3600).toString().padStart(2, '0')}:
            {Math.floor((simulationTime % 3600) / 60).toString().padStart(2, '0')}:
            {Math.floor(simulationTime % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Physics Engine Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20"></span>
          <span>PHYSICS: {systemStatus.pythonEngine === 'ONLINE' ? 'PY-RK4' : 'CLIENT-RK4'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">J2 + DRAG</span>
        </div>

        {/* Data Source Latency */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>CELESTRAK: {systemStatus.orbitalData}</span>
        </div>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2">
        {/* Voice Comms Trigger (CAPCOM Live Audio) */}
        {onOpenVoiceComms && (
          <button
            onClick={onOpenVoiceComms}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 rounded transition-all shadow-sm hover:border-cyan-500"
            title="CAPCOM Live Audio Channel (gemini-3.8-live)"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline font-semibold">VOICE COMMS</span>
          </button>
        )}

        {/* AI Chat trigger */}
        {onOpenAIChat && (
          <button
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded transition-colors"
            title="Mission Control Gemini Chatbot"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">AI CHAT</span>
          </button>
        )}

        {/* Cloud Sync / Firebase Auth button */}
        {onOpenCloudSync && (
          <button
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded transition-colors"
            title="Firebase Cloud Sync & Google Auth"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="User"
                className="w-4 h-4 rounded-full border border-cyan-400"
              />
            ) : currentUser ? (
              <div className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[9px] text-cyan-300 font-bold">
                {currentUser.displayName?.charAt(0) || 'U'}
              </div>
            ) : (
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden md:inline font-semibold">
              {currentUser ? 'CLOUD SYNCED' : 'SIGN IN / SYNC'}
            </span>
          </button>
        )}

        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded transition-colors"
          title="Command Palette (Ctrl+K)"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400">Ctrl+K</span>
        </button>

        <button
          onClick={onResetSimulation}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-800 transition-colors"
          title="Reset Simulation Clock"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded transition-colors"
        >
          <FileDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPORT</span>
        </button>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded transition-all shadow-sm ${
            isSimulating
              ? 'bg-amber-600/80 text-amber-100 cursor-wait'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'PROPAGATING...' : 'RUN SIMULATION'}</span>
        </button>
      </div>
    </header>
  );
};
