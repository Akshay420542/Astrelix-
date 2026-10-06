/**
 * Mission Control Command Palette (Ctrl + K)
 * Includes Google Search Grounding for Real-Time Orbital Debris Reports & Launch Schedules
 */
import React, { useState, useEffect } from 'react';
import {
  Search,
  Compass,
  Play,
  RotateCcw,
  Globe,
  Camera,
  Layers,
  FileDown,
  X,
  Radio,
  ExternalLink,
  Loader2,
  Calendar,
  ShieldAlert,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Bot,
  MapPin
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { CameraViewMode } from '../3d/SpaceScene';

interface GroundingReport {
  query: string;
  category: string;
  text: string;
  sources: { title: string; uri: string }[];
  timestampUtc: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onRunSimulation: () => void;
  onResetSimulation: () => void;
  onSetCameraView: (view: CameraViewMode) => void;
  onTogglePlay: () => void;
  onOpenExportModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onRunSimulation,
  onResetSimulation,
  onSetCameraView,
  onTogglePlay,
  onOpenExportModal
}) => {
  const [query, setQuery] = useState('');
  const [groundingReport, setGroundingReport] = useState<GroundingReport | null>(null);
  const [isGroundingLoading, setIsGroundingLoading] = useState(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        if (groundingReport) {
          setGroundingReport(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, groundingReport]);

  if (!isOpen) return null;

  // Execute Google Search Grounding fetch
  const handleFetchGrounding = async (
    searchQuery: string,
    category: 'DEBRIS' | 'LAUNCHES' | 'CUSTOM'
  ) => {
    setIsGroundingLoading(true);
    setGroundingError(null);
    try {
      const res = await fetch('/api/grounding/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, category })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Failed to fetch grounded report`);
      }

      const data: GroundingReport = await res.json();
      setGroundingReport(data);
    } catch (err: any) {
      setGroundingError(err.message || 'Error executing Google Search grounding request');
    } finally {
      setIsGroundingLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!groundingReport) return;
    navigator.clipboard.writeText(groundingReport.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Base list of mission commands
  const defaultActions = [
    {
      id: 'grounding-debris',
      title: 'Fetch Orbital Debris Report (Google Search)',
      desc: 'Retrieve current trackings, fragmentations & conjunction warnings',
      icon: ShieldAlert,
      category: 'Search Grounding',
      action: () =>
        handleFetchGrounding(
          'Latest space debris fragmentation events and orbital tracking warnings in Low Earth Orbit 2026',
          'DEBRIS'
        )
    },
    {
      id: 'grounding-launches',
      title: 'Fetch Real-Time Launch Schedules (Google Search)',
      desc: 'Retrieve verified orbital rocket launches and manifest schedules',
      icon: Calendar,
      category: 'Search Grounding',
      action: () =>
        handleFetchGrounding(
          'Upcoming space rocket orbital launches schedule this month worldwide',
          'LAUNCHES'
        )
    },
    {
      id: 'run-sim',
      title: 'Run Numerical Simulation',
      desc: 'Propagate current trajectory using RK4 physics',
      icon: Play,
      category: 'Simulation',
      action: () => {
        onRunSimulation();
        onClose();
      }
    },
    {
      id: 'toggle-play',
      title: 'Toggle Simulation Play/Pause',
      desc: 'Start or freeze real-time simulation clock',
      icon: Play,
      category: 'Timeline',
      action: () => {
        onTogglePlay();
        onClose();
      }
    },
    {
      id: 'reset-sim',
      title: 'Reset Clock to Epoch',
      desc: 'Restore simulation elapsed time to T+00:00:00',
      icon: RotateCcw,
      category: 'Timeline',
      action: () => {
        onResetSimulation();
        onClose();
      }
    },
    {
      id: 'cam-earth',
      title: 'Camera: Earth-Centric View',
      desc: 'Focus camera on Earth with nominal distance',
      icon: Globe,
      category: 'Viewport',
      action: () => {
        onSetCameraView('EARTH');
        onClose();
      }
    },
    {
      id: 'cam-orbit',
      title: 'Camera: Orbital Plane View',
      desc: 'Align camera with spacecraft orbital trajectory',
      icon: Camera,
      category: 'Viewport',
      action: () => {
        onSetCameraView('ORBIT');
        onClose();
      }
    },
    {
      id: 'cam-follow',
      title: 'Camera: Lock & Follow Spacecraft',
      desc: 'Track target satellite along true anomaly path',
      icon: Camera,
      category: 'Viewport',
      action: () => {
        onSetCameraView('FOLLOW');
        onClose();
      }
    },
    {
      id: 'nav-maneuvers',
      title: 'Open Maneuver Planner',
      desc: 'Add prograde, retrograde, or normal burns',
      icon: Layers,
      category: 'Navigation',
      action: () => {
        onSelectTab('maneuvers');
        onClose();
      }
    },
    {
      id: 'nav-transfers',
      title: 'Open Orbit Transfer Calculator',
      desc: 'Solve Hohmann and bi-elliptic transfers',
      icon: Compass,
      category: 'Navigation',
      action: () => {
        onSelectTab('transfers');
        onClose();
      }
    },
    {
      id: 'nav-sda',
      title: 'Open Space Domain Awareness (SDA)',
      desc: 'Screen conjunctions, 3D covariance & collision probability',
      icon: ShieldAlert,
      category: 'Navigation',
      action: () => {
        onSelectTab('sda');
        onClose();
      }
    },
    {
      id: 'nav-propagators',
      title: 'Open Multi-Body Propagator Engine (GMAT/Orekit)',
      desc: 'Configure J2-J4 harmonics, Moon/Sun gravity & SRP',
      icon: Layers,
      category: 'Navigation',
      action: () => {
        onSelectTab('propagators');
        onClose();
      }
    },
    {
      id: 'nav-linkbudget',
      title: 'Open RF Link-Budget & Ground Station Mapping',
      desc: 'Compute S/X/Ka path loss, Eb/N0 and telemetry closure',
      icon: Radio,
      category: 'Navigation',
      action: () => {
        onSelectTab('linkbudget');
        onClose();
      }
    },
    {
      id: 'nav-contingency',
      title: 'Open "What-If" Contingency & Anomaly Solver',
      desc: 'Simulate thruster underburns & automated recovery burns',
      icon: ShieldAlert,
      category: 'Navigation',
      action: () => {
        onSelectTab('contingency');
        onClose();
      }
    },
    {
      id: 'nav-digitalthread',
      title: 'Open Multi-Agency Workspace & Digital Thread',
      desc: 'Review agency review locks, CAD lineage & cryptographic hashes',
      icon: Globe,
      category: 'Navigation',
      action: () => {
        onSelectTab('digitalthread');
        onClose();
      }
    },
    {
      id: 'nav-validation',
      title: 'Engineering Validation Suite',
      desc: 'Benchmark numerical errors against analytical mechanics',
      icon: Compass,
      category: 'Navigation',
      action: () => {
        onSelectTab('validation');
        onClose();
      }
    },
    {
      id: 'nav-aichat',
      title: 'Open Gemini Mission Control Chatbot',
      desc: 'Multi-turn astrodynamics guidance via gemini-3.1-pro & gemini-3.5-flash',
      icon: Bot,
      category: 'AI Intelligence',
      action: () => {
        onSelectTab('aichat');
        onClose();
      }
    },
    {
      id: 'nav-mapsgrounding',
      title: 'Open Google Maps Ground Station Intelligence',
      desc: 'Ground truth facility telemetry dishes via gemini-3.5-flash & Google Maps',
      icon: MapPin,
      category: 'AI Intelligence',
      action: () => {
        onSelectTab('mapsgrounding');
        onClose();
      }
    },
    {
      id: 'export-mission',
      title: 'Export Mission Summary Report',
      desc: 'Download CSV, JSON, and formatted technical report',
      icon: FileDown,
      category: 'Data',
      action: () => {
        onOpenExportModal();
        onClose();
      }
    }
  ];

  const filtered = defaultActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-[#0b0e17] border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3">
          {groundingReport ? (
            <button
              onClick={() => setGroundingReport(null)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 flex items-center gap-1 text-[11px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && !groundingReport) {
                handleFetchGrounding(query.trim(), 'CUSTOM');
              }
            }}
            placeholder={
              groundingReport
                ? 'Grounded Report View...'
                : "Type command or custom search (Press Enter to ground with Google Search)..."
            }
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />

          {!groundingReport && query.trim() && (
            <button
              onClick={() => handleFetchGrounding(query.trim(), 'CUSTOM')}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-semibold whitespace-nowrap flex items-center gap-1"
            >
              <Radio className="w-3 h-3" />
              <span>Ground with Google</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {isGroundingLoading && (
          <div className="p-10 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            <div className="text-slate-300 font-semibold">
              Grounding with Google Search...
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Retrieving live orbital ephemerides, debris fragments, or upcoming space launch manifest.
            </p>
          </div>
        )}

        {/* Error State */}
        {groundingError && (
          <div className="p-4 m-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Grounding Service Error:</span>
              <p className="mt-0.5 text-rose-400">{groundingError}</p>
            </div>
          </div>
        )}

        {/* Grounding Report View */}
        {groundingReport && !isGroundingLoading && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                  GOOGLE SEARCH GROUNDED
                </span>
                <span className="text-slate-400 text-[11px] font-semibold">
                  {groundingReport.category}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(groundingReport.timestampUtc).toLocaleTimeString()} UTC
              </span>
            </div>

            {/* Content Body */}
            <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans selection:bg-cyan-500/30">
              {groundingReport.text}
            </div>

            {/* Verified Web Citations */}
            {groundingReport.sources && groundingReport.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Verified Grounding Citations:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {groundingReport.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-cyan-300 flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate pr-2 text-slate-300 group-hover:text-cyan-200">
                        {src.title || src.uri}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Standard Actions List (When not viewing report) */}
        {!groundingReport && !isGroundingLoading && (
          <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No standard commands matching "{query}".
                <div className="mt-2 text-cyan-400">
                  Press Enter to perform a live Google Search grounded query.
                </div>
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-slate-800/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/40 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 group-hover:text-slate-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500 flex justify-between">
          <span>Enter: Execute / Ground with Google Search</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
