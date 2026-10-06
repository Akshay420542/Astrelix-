/**
 * Cloud Mission Sync & Firebase Authentication Modal
 * Integrates Google Sign-In and Firestore persistent mission storage.
 */
import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Cloud,
  CloudUpload,
  CloudDownload,
  Trash2,
  LogOut,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Database,
  Calendar
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  saveMissionToCloud,
  fetchUserMissions,
  deleteMissionFromCloud
} from '../../lib/firebase';
import { Mission } from '../../types/mission';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMission: Mission;
  onLoadMission: (mission: Mission) => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentMission,
  onLoadMission,
  currentUser,
  onUserChange
}) => {
  const [savedMissions, setSavedMissions] = useState<any[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch saved missions whenever user is logged in and modal is open
  useEffect(() => {
    if (isOpen && currentUser) {
      loadSavedMissions();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const loadSavedMissions = async () => {
    if (!currentUser) return;
    setIsLoadingMissions(true);
    setErrorMsg(null);
    try {
      const missions = await fetchUserMissions(currentUser.uid);
      setSavedMissions(missions);
    } catch (e: any) {
      setErrorMsg('Failed to load missions from Firestore.');
    } finally {
      setIsLoadingMissions(false);
    }
  };

  const handleSignIn = async () => {
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      onUserChange(user);
    } catch (e: any) {
      setErrorMsg(e.message || 'Google Sign-In failed.');
    }
  };

  const handleSignOut = async () => {
    await logOut();
    onUserChange(null);
    setSavedMissions([]);
  };

  const handleSaveCurrent = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await saveMissionToCloud(currentUser.uid, currentMission);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await loadSavedMissions();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save mission to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (missionId: string) => {
    if (!currentUser) return;
    try {
      await deleteMissionFromCloud(currentUser.uid, missionId);
      setSavedMissions((prev) => prev.filter((m) => m.id !== missionId));
    } catch (e: any) {
      setErrorMsg('Failed to delete mission from Firestore.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0e17] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white uppercase tracking-wider">
              FIREBASE CLOUD PERSISTENCE & AUTH
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 bg-slate-950/80">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Auth Card */}
          {currentUser ? (
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-cyan-500/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 font-bold">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white text-xs">
                    {currentUser.displayName || 'Flight Director'}
                  </div>
                  <div className="text-[10px] text-slate-400">{currentUser.email}</div>
                  <div className="text-[9px] text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>AUTHENTICATED VIA GOOGLE OAUTH</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>SIGN OUT</span>
              </button>
            </div>
          ) : (
            <div className="p-6 bg-slate-900/90 border border-dashed border-slate-700 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs uppercase">
                  PERSIST ORBITAL MISSIONS IN CLOUD FIRESTORE
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Sign in with your Google account to sync your spacecraft trajectories, maneuvers, and telemetry models across devices.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg transition-all hover:scale-105"
              >
                <UserIcon className="w-4 h-4" />
                <span>SIGN IN WITH GOOGLE</span>
              </button>
            </div>
          )}

          {/* Current Mission Sync Action */}
          {currentUser && (
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    ACTIVE MISSION BUFFER
                  </span>
                  <span className="font-bold text-white text-xs">{currentMission.name}</span>
                </div>

                <button
                  onClick={handleSaveCurrent}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>{saveSuccess ? 'SAVED TO CLOUD' : 'SAVE TO FIRESTORE'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Saved Missions List from Firestore */}
          {currentUser && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center justify-between">
                <span>SAVED MISSIONS IN CLOUD FIRESTORE ({savedMissions.length})</span>
                {isLoadingMissions && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
              </span>

              {savedMissions.length === 0 && !isLoadingMissions ? (
                <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                  No saved missions in your Firestore database yet. Click "Save to Firestore" above to persist the current mission.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {savedMissions.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">{m.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{m.objective}</span>
                          <span>·</span>
                          <span>{m.spacecraft?.name || 'Craft'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onLoadMission(m);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded text-[11px] font-semibold transition-colors"
                        >
                          <CloudDownload className="w-3 h-3" />
                          <span>RESTORE</span>
                        </button>

                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
