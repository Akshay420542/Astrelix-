/**
 * PHYSICS-ACCURATE ORBITAL MISSION PLANNER
 * Real-Time Space Mission Simulation & Analysis Platform
 * "Design. Simulate. Analyze. Navigate."
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mission, SatelliteRecord, TrajectoryPoint } from './types/mission';
import { PRESET_MISSIONS } from './data/presetMissions';
import { INITIAL_SATELLITES } from './data/satellitesData';
import { apiClient, SystemStatus } from './api/apiClient';

// Components
import { Header } from './components/common/Header';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { TimelineControls } from './components/common/TimelineControls';
import { CommandPalette } from './components/common/CommandPalette';
import { SpaceScene, CameraViewMode, ScaleMode } from './components/3d/SpaceScene';
import { MissionPlannerView } from './components/mission/MissionPlannerView';
import { SatelliteCatalogView } from './components/satellites/SatelliteCatalogView';
import { SpacecraftConfigView } from './components/spacecraft/SpacecraftConfigView';
import { ManeuverPlannerView } from './components/maneuver/ManeuverPlannerView';
import { TransferPlannerView } from './components/transfer/TransferPlannerView';
import { TelemetryDashboard } from './components/telemetry/TelemetryDashboard';
import { GroundTrackView } from './components/groundtrack/GroundTrackView';
import { PassPredictionView } from './components/visibility/PassPredictionView';
import { MissionAnalysisView } from './components/analysis/MissionAnalysisView';
import { ScenarioComparisonView } from './components/scenarios/ScenarioComparisonView';
import { EngineeringValidationView } from './components/validation/EngineeringValidationView';
import { DataSourcesView } from './components/datasources/DataSourcesView';
import { LandingView } from './components/landing/LandingView';
import { MissionExportModal } from './components/export/MissionExportModal';

// Advanced Astrodynamics, SDA, Link Budget, Multi-Agency & Contingency Views
import { DigitalThreadWorkspaceView } from './components/collaboration/DigitalThreadWorkspaceView';
import { SpaceDomainAwarenessView } from './components/sda/SpaceDomainAwarenessView';
import { HighFidelityPropagatorView } from './components/propagators/HighFidelityPropagatorView';
import { LinkBudgetView } from './components/linkbudget/LinkBudgetView';
import { WhatIfContingencyView } from './components/contingency/WhatIfContingencyView';

// Gemini AI & Maps Grounding Views & Modals
import { MapsGroundingView } from './components/ai/MapsGroundingView';
import { GeminiChatbotView } from './components/ai/GeminiChatbotView';
import { VoiceConversationModal } from './components/ai/VoiceConversationModal';
import { CloudSyncModal } from './components/auth/CloudSyncModal';

// Firebase Auth & Database
import { auth, testFirestoreConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'LANDING' | 'MISSION_CONTROL'>('MISSION_CONTROL');
  const [activeTab, setActiveTab] = useState<ActiveTab>('mission');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isVoiceCommsOpen, setIsVoiceCommsOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Mission & Satellites State
  const [activeMission, setActiveMission] = useState<Mission>(PRESET_MISSIONS[0]);
  const [satellites, setSatellites] = useState<SatelliteRecord[]>(INITIAL_SATELLITES);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteRecord | null>(null);

  // Trajectory Simulation State
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0); // seconds from epoch
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeWarp, setTimeWarp] = useState(10); // default 10x speed

  // 3D Viewport Controls
  const [cameraView, setCameraView] = useState<CameraViewMode>('EARTH');
  const [scaleMode, setScaleMode] = useState<ScaleMode>('REAL');
  const [showOrbits, setShowOrbits] = useState(true);
  const [showGroundTracks, setShowGroundTracks] = useState(true);
  const [showOtherSatellites, setShowOtherSatellites] = useState(true);

  // System & Connection Status
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    javaBackend: 'ONLINE',
    pythonEngine: 'ONLINE',
    database: 'ONLINE',
    orbitalData: 'ONLINE',
    webGlEngine: 'ONLINE',
    latencyMs: 38
  });

  // Calculate current UTC Date string for simulation clock
  const baseEpochMs = new Date(activeMission.epochUtc).getTime();
  const currentSimDate = new Date(baseEpochMs + simulationTime * 1000);
  const utcDateString = currentSimDate.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Run Trajectory Numerical Propagation
  const handleRunSimulation = useCallback(async () => {
    setIsSimulating(true);
    try {
      const result = await apiClient.runSimulation(activeMission, 28800, 25);
      setTrajectory(result.trajectory);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [activeMission]);

  // Initial propagation on load or mission change
  useEffect(() => {
    handleRunSimulation();
  }, [activeMission.id, activeMission.fidelity, activeMission.enableAtmosphericDrag]);

  // Check system status & Firebase authentication
  useEffect(() => {
    apiClient.getSystemStatus().then(setSystemStatus);
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time animation loop for time warp
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setSimulationTime((prev) => prev + deltaSec * timeWarp);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, timeWarp]);

  // Keyboard shortcut listener (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Adopt orbit from satellite catalog
  const handleAdoptOrbitAsMission = (sat: SatelliteRecord) => {
    const updated: Mission = {
      ...activeMission,
      name: `${sat.name} Tracking & Maneuvers`,
      objective: 'STATION_KEEPING',
      initialOrbit: { ...sat.elements },
      spacecraft: {
        ...activeMission.spacecraft,
        name: sat.name
      }
    };
    setActiveMission(updated);
    setActiveTab('mission');
    handleRunSimulation();
  };

  if (viewMode === 'LANDING') {
    return (
      <LandingView
        onLaunchMissionControl={() => setViewMode('MISSION_CONTROL')}
        onExploreDemo={() => {
          setActiveMission(PRESET_MISSIONS[0]);
          setViewMode('MISSION_CONTROL');
          handleRunSimulation();
        }}
      />
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#05070c] text-slate-100 font-mono overflow-hidden select-none">
      {/* Top Bar Header */}
      <Header
        systemStatus={systemStatus}
        simulationTime={simulationTime}
        utcDateString={utcDateString}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetSimulation={() => setSimulationTime(0)}
        onRunSimulation={handleRunSimulation}
        isSimulating={isSimulating}
        onOpenLanding={() => setViewMode('LANDING')}
        onOpenVoiceComms={() => setIsVoiceCommsOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenAIChat={() => {
          setActiveTab('aichat');
          setIsInspectorOpen(true);
        }}
        currentUser={currentUser}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsInspectorOpen(true);
          }}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Central 3D Space Viewport Canvas */}
        <main className="flex-1 relative h-full bg-[#030509]">
          <SpaceScene
            activeMission={activeMission}
            satellites={satellites}
            selectedSatellite={selectedSatellite}
            onSelectSatellite={setSelectedSatellite}
            simulationTime={simulationTime}
            isPlaying={isPlaying}
            timeWarp={timeWarp}
            cameraView={cameraView}
            scaleMode={scaleMode}
            showOrbits={showOrbits}
            showGroundTracks={showGroundTracks}
            showOtherSatellites={showOtherSatellites}
          />

          {/* Quick HUD overlay in viewport corner */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex flex-col gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>MISSION: {activeMission.name}</span>
            </div>
            <div className="text-slate-400">
              VEHICLE: {activeMission.spacecraft.name} · {activeMission.spacecraft.dryMass + activeMission.spacecraft.fuelMass} kg
            </div>
            <div className="text-cyan-300">
              PERIAPSIS: {(activeMission.initialOrbit.a * (1 - activeMission.initialOrbit.e) - 6378.14).toFixed(1)} km ·{' '}
              APOAPSIS: {(activeMission.initialOrbit.a * (1 + activeMission.initialOrbit.e) - 6378.14).toFixed(1)} km
            </div>
          </div>
        </main>

        {/* Right Context-Sensitive Inspector Panel */}
        {isInspectorOpen && (
          <aside className="w-[460px] max-w-[45vw] h-full border-l border-slate-800 bg-[#070a12]/95 backdrop-blur-md flex flex-col shrink-0 z-10 shadow-2xl">
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'mission' && (
                <MissionPlannerView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'satellites' && (
                <SatelliteCatalogView
                  satellites={satellites}
                  selectedSatellite={selectedSatellite}
                  onSelectSatellite={setSelectedSatellite}
                  onAdoptOrbitAsMission={handleAdoptOrbitAsMission}
                />
              )}

              {activeTab === 'spacecraft' && (
                <SpacecraftConfigView
                  spacecraft={activeMission.spacecraft}
                  onChangeSpacecraft={(updated) =>
                    setActiveMission({ ...activeMission, spacecraft: updated })
                  }
                />
              )}

              {activeTab === 'orbits' && (
                <MissionPlannerView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'maneuvers' && (
                <ManeuverPlannerView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'transfers' && (
                <TransferPlannerView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'sda' && (
                <SpaceDomainAwarenessView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'propagators' && (
                <HighFidelityPropagatorView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'linkbudget' && <LinkBudgetView />}

              {activeTab === 'contingency' && (
                <WhatIfContingencyView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'digitalthread' && (
                <DigitalThreadWorkspaceView mission={activeMission} />
              )}

              {activeTab === 'telemetry' && (
                <TelemetryDashboard
                  mission={activeMission}
                  trajectory={trajectory}
                  simulationTime={simulationTime}
                />
              )}

              {activeTab === 'groundtrack' && (
                <GroundTrackView
                  trajectory={trajectory}
                  simulationTime={simulationTime}
                />
              )}

              {activeTab === 'visibility' && (
                <PassPredictionView trajectory={trajectory} />
              )}

              {activeTab === 'analysis' && (
                <MissionAnalysisView
                  mission={activeMission}
                  trajectory={trajectory}
                />
              )}

              {activeTab === 'scenarios' && <ScenarioComparisonView />}

              {activeTab === 'validation' && (
                <EngineeringValidationView
                  mission={activeMission}
                  onChangeMission={setActiveMission}
                  onRunSimulation={handleRunSimulation}
                />
              )}

              {activeTab === 'datasources' && (
                <DataSourcesView
                  systemStatus={systemStatus}
                  onRefreshStatus={() =>
                    apiClient.getSystemStatus().then(setSystemStatus)
                  }
                />
              )}

              {activeTab === 'aichat' && (
                <GeminiChatbotView mission={activeMission} />
              )}

              {activeTab === 'mapsgrounding' && (
                <MapsGroundingView />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Timeline Controls */}
      <TimelineControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        timeWarp={timeWarp}
        onSetTimeWarp={setTimeWarp}
        onStepForward={() => setSimulationTime((t) => t + 60)}
        onStepBackward={() => setSimulationTime((t) => Math.max(0, t - 60))}
        cameraView={cameraView}
        onSetCameraView={setCameraView}
        scaleMode={scaleMode}
        onSetScaleMode={setScaleMode}
        showOrbits={showOrbits}
        onToggleOrbits={() => setShowOrbits(!showOrbits)}
        showOtherSatellites={showOtherSatellites}
        onToggleOtherSatellites={() => setShowOtherSatellites(!showOtherSatellites)}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsInspectorOpen(true);
        }}
        onRunSimulation={handleRunSimulation}
        onResetSimulation={() => setSimulationTime(0)}
        onSetCameraView={setCameraView}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Export Modal */}
      <MissionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mission={activeMission}
        trajectory={trajectory}
      />

      {/* Real-Time Voice Comms Modal (gemini-3.8-live) */}
      <VoiceConversationModal
        isOpen={isVoiceCommsOpen}
        onClose={() => setIsVoiceCommsOpen(false)}
        missionName={activeMission.name}
      />

      {/* Firebase Cloud Sync & Authentication Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        currentMission={activeMission}
        onLoadMission={(m) => {
          setActiveMission(m);
          handleRunSimulation();
        }}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </div>
  );
}
