/**
 * Real-Time Mission Control Voice Uplink (CAPCOM Comms Channel)
 * Interactive voice conversations using gemini-3.8-live & audio speech synthesis.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  X,
  Loader2,
  Sparkles,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface VoiceCommsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionName?: string;
}

interface CommsEntry {
  speaker: 'PILOT' | 'CAPCOM';
  text: string;
  time: string;
}

export const VoiceConversationModal: React.FC<VoiceCommsModalProps> = ({
  isOpen,
  onClose,
  missionName = 'Active Orbital Mission'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceName, setVoiceName] = useState<'Kore' | 'Puck' | 'Fenrir' | 'Zephyr'>('Kore');
  const [transcriptInput, setTranscriptInput] = useState('');
  const [commsLog, setCommsLog] = useState<CommsEntry[]>([
    {
      speaker: 'CAPCOM',
      text: 'Houston CAPCOM standing by on orbital voice loop. State your telemetry report or maneuver query.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          if (spoken) {
            handleSendVoiceMessage(spoken);
          }
        };

        recog.onerror = () => {
          setIsRecording(false);
        };

        recog.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.warn('SpeechRecognition start notice:', e);
        }
      } else {
        // Fallback prompt for browsers without webkitSpeechRecognition
        const manual = prompt('Enter your radio transmission to CAPCOM:');
        if (manual) handleSendVoiceMessage(manual);
      }
    }
  };

  const handleSendVoiceMessage = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    const pilotEntry: CommsEntry = {
      speaker: 'PILOT',
      text: spokenText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setCommsLog((prev) => [...prev, pilotEntry]);
    setTranscriptInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/voice-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: spokenText,
          voiceName
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: CAPCOM audio unavailable`);
      }

      const data = await res.json();
      const capcomEntry: CommsEntry = {
        speaker: 'CAPCOM',
        text: data.replyText || 'Copy that, flight.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setCommsLog((prev) => [...prev, capcomEntry]);

      // Play synthesized audio if returned
      if (data.audioBase64) {
        playWavBase64(data.audioBase64);
      }
    } catch (err: any) {
      setCommsLog((prev) => [
        ...prev,
        {
          speaker: 'CAPCOM',
          text: `Static on frequency: ${err.message || 'Signal lost.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playWavBase64 = (base64Audio: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      currentAudioRef.current = audio;
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch (e) {
      console.warn('Playback error:', e);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0e17] border border-cyan-800/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-semibold text-white uppercase tracking-wider">
              CAPCOM REAL-TIME VOICE UPLINK
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-700 text-cyan-300">
              gemini-3.8-live · 24kHz
            </span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Visualizer & Frequency Wave Banner */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
          {/* Animated waveform bars */}
          <div className="flex items-center gap-1.5 h-12">
            {[40, 65, 85, 30, 95, 70, 50, 90, 45, 80, 60, 100, 35, 75, 55].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isRecording
                    ? 'bg-rose-500 animate-pulse'
                    : isPlayingAudio
                    ? 'bg-cyan-400 animate-pulse'
                    : isProcessing
                    ? 'bg-amber-400'
                    : 'bg-slate-800'
                }`}
                style={{
                  height: isRecording || isPlayingAudio ? `${Math.max(8, (h * Math.random()) + 15)}px` : '6px'
                }}
              />
            ))}
          </div>

          {/* Status readout */}
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isRecording
                  ? 'bg-rose-500 animate-ping'
                  : isPlayingAudio
                  ? 'bg-cyan-400 animate-ping'
                  : isProcessing
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-bold text-slate-200">
              {isRecording
                ? 'TRANSMITTING VOICE (MIC ACTIVE)...'
                : isPlayingAudio
                ? 'RECEIVING CAPCOM TRANSMISSION...'
                : isProcessing
                ? 'PROCESSING ORBITAL TELEMETRY...'
                : 'FREQUENCY 2287.5 MHz · CHANNEL OPEN'}
            </span>
          </div>

          {/* Voice selector */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>CAPCOM VOICE:</span>
            {(['Kore', 'Puck', 'Fenrir', 'Zephyr'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVoiceName(v)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  voiceName === v
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Comms Transcript Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080c16] max-h-64">
          {commsLog.map((log, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-xs ${
                log.speaker === 'PILOT'
                  ? 'bg-cyan-950/30 border-cyan-800/60 ml-6 text-cyan-100'
                  : 'bg-slate-900 border-slate-800 mr-6 text-slate-200'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                <span className={log.speaker === 'PILOT' ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                  {log.speaker === 'PILOT' ? 'FLIGHT PILOT' : 'HOUSTON CAPCOM'}
                </span>
                <span>{log.time}</span>
              </div>
              <p className="leading-relaxed">{log.text}</p>
            </div>
          ))}
        </div>

        {/* Interactive Controls Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#070a12] space-y-3">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleRecording}
              className={`p-4 rounded-full border shadow-lg transition-all flex items-center justify-center ${
                isRecording
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-900/50'
                  : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400 text-white shadow-cyan-900/40 hover:scale-105'
              }`}
              title={isRecording ? 'Stop Transmitting' : 'Push to Talk'}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>

          {/* Text transmission fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (transcriptInput.trim()) {
                handleSendVoiceMessage(transcriptInput.trim());
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              placeholder="Or type radio query (e.g. 'Status of periapsis burn and fuel margin')..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !transcriptInput.trim()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors font-semibold"
            >
              TRANSMIT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
