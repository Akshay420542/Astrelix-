/**
 * Mission Control Multi-Turn Gemini Chatbot
 * Supports gemini-3.1-pro-preview (complex STEM), gemini-3.5-flash (general), gemini-3.1-flash-lite (fast)
 * Maintains full multi-turn conversation history with specialized flight controller roles.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Cpu,
  Brain,
  Shield,
  Rocket
} from 'lucide-react';
import { Mission } from '../../types/mission';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

type ModelTier = 'fast' | 'general' | 'complex';

interface BotRole {
  id: string;
  name: string;
  tier: ModelTier;
  modelName: string;
  badge: string;
  icon: any;
  instruction: string;
}

const BOT_ROLES: BotRole[] = [
  {
    id: 'fdo',
    name: 'Flight Dynamics Officer (FDO)',
    tier: 'fast',
    modelName: 'gemini-3.1-flash-lite',
    badge: 'FAST / LOW LATENCY',
    icon: Zap,
    instruction:
      'You are the Flight Dynamics Officer (FDO) in Mission Control. You specialize in real-time trajectory status, orbital element triage, and rapid delta-V checks. Keep responses fast, concise, accurate, and mathematical.'
  },
  {
    id: 'flight-director',
    name: 'Mission Flight Director',
    tier: 'general',
    modelName: 'gemini-3.5-flash',
    badge: 'GENERAL PLANNING',
    icon: Rocket,
    instruction:
      'You are the Mission Flight Director leading orbital operations. You synthesize flight plans, ground station schedules, Hohmann transfers, and payload operations into authoritative aerospace guidance.'
  },
  {
    id: 'astrodynamicist',
    name: 'Lead Astrodynamicist',
    tier: 'complex',
    modelName: 'gemini-3.1-pro-preview',
    badge: 'ADVANCED STEM & NBODY',
    icon: Brain,
    instruction:
      'You are the Lead Astrodynamics Research Fellow. You specialize in deep orbital mechanics, J2-J4 geopotential harmonics, Jacchia-Bowman atmospheric drag spiral decay, Lagrange points, and relativistic astrodynamics.'
  }
];

const SUGGESTED_PROMPTS = [
  'Compute Hohmann transfer delta-V from 400 km LEO to GEO (35,786 km)',
  'Explain Jacchia-Bowman thermospheric density model vs simple exponential drag',
  'What is the nodal regression rate for a Sun-Synchronous orbit at 600 km?',
  'Evaluate collision probability and covariance screening in LEO debris shells',
  'Compare bi-elliptic transfer vs Hohmann transfer efficiency at high radius ratios'
];

interface GeminiChatbotViewProps {
  mission?: Mission;
}

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({ mission }) => {
  const [selectedRole, setSelectedRole] = useState<BotRole>(BOT_ROLES[1]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Mission Control Flight Controller online. Active mission: "${mission?.name || 'LEO to GEO Transfer'}". I am standing by to assist with orbital transfers, Delta-V budgets, numerical propagation, and contingency planning. How can I assist flight operations?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare mission context in system prompt
      const contextAddition = mission
        ? `\nCurrent Active Mission Context:\n- Name: ${mission.name}\n- Semi-Major Axis: ${mission.initialOrbit.a.toFixed(1)} km\n- Altitude: ${(mission.initialOrbit.a - 6378.14).toFixed(1)} km\n- Eccentricity: ${mission.initialOrbit.e}\n- Inclination: ${mission.initialOrbit.i}°\n- Vehicle: ${mission.spacecraft.name} (Dry: ${mission.spacecraft.dryMass}kg, Fuel: ${mission.spacecraft.fuelMass}kg)\n- Atmospheric Drag: ${mission.enableAtmosphericDrag ? 'ENABLED' : 'DISABLED'}`
        : '';

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content
          })),
          systemInstruction: selectedRole.instruction + contextAddition,
          modelTier: selectedRole.tier
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Chat response failed`);
      }

      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Telemetry acknowledged.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedRole.modelName
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Flight communication error: ${err.message || 'Failed to connect to Mission Control AI.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'SYSTEM'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: `Chat session reset. Flight dynamics console initialized for ${selectedRole.name}. Ready for inputs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedRole.modelName
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs bg-[#070a12]">
      {/* Top Bar / Role Selector */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white uppercase text-xs">
              GEMINI MISSION CONTROL CHATBOT
            </span>
          </div>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-slate-900"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>

        {/* Role Pills */}
        <div className="grid grid-cols-3 gap-1.5">
          {BOT_ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`p-1.5 rounded border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="font-semibold text-[10px] truncate">{role.name}</span>
                </div>
                <div className="text-[8px] text-slate-500 truncate mt-0.5">{role.modelName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Header info */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-1 px-1">
              {msg.role === 'user' ? (
                <>
                  <span>YOU</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="text-cyan-400 font-bold">{selectedRole.name}</span>
                  {msg.modelUsed && (
                    <span className="px-1 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400">
                      {msg.modelUsed}
                    </span>
                  )}
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[88%] p-3 rounded-lg border text-xs leading-relaxed relative group ${
                msg.role === 'user'
                  ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-100 rounded-tr-none'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none font-sans'
              }`}
            >
              <div className="whitespace-pre-wrap selection:bg-cyan-500/30 font-sans">
                {msg.content}
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopyMessage(msg.id, msg.content)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 transition-all"
                title="Copy response"
              >
                {copiedId === msg.id ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 text-slate-400 text-xs p-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-cyan-300 font-semibold">{selectedRole.name} calculating...</span>
              <span className="text-[10px] text-slate-500">
                Solving trajectory dynamics via {selectedRole.modelName}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/90 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700 text-slate-400 hover:text-cyan-200 rounded text-[10px] transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-[#070a12] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${selectedRole.name} (${selectedRole.modelName})...`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
};
