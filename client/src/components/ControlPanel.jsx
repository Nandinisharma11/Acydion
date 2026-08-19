import React, { useState } from 'react';
import { Play, Square, ShieldCheck, ShieldAlert, Cpu, Clock, RefreshCw, Layers, Lock, Unlock, Database, Loader2 } from 'lucide-react';

export function ControlPanel({ isRunning, onStart, onStop }) {
  const [targetKey, setTargetKey] = useState('REMOTEOK');
  const [pacingProfile, setPacingProfile] = useState('HUMAN_STEALTH');
  const [stealthEnabled, setStealthEnabled] = useState(true);
  const [rotateIdentities, setRotateIdentities] = useState(true);
  const [maxBatches, setMaxBatches] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRunning) {
      setLoading(true);
      await onStop();
      setLoading(false);
    } else {
      setLoading(true);
      await onStart({
        targetKey,
        pacingProfile,
        stealthEnabled,
        rotateIdentities,
        maxBatches: Number(maxBatches)
      });
      setLoading(false);
    }
  };

  const getTargetBadge = () => {
    if (targetKey === 'GLASSDOOR_SOFT_WALL') {
      return (
        <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 bg-cyan-500/8 px-2 py-0.5 rounded-md border border-cyan-500/15">
          <Unlock className="w-3 h-3" /> Soft Wall
        </span>
      );
    }
    if (targetKey === 'GLASSDOOR_HARD_WALL') {
      return (
        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/8 px-2 py-0.5 rounded-md border border-amber-500/15">
          <Lock className="w-3 h-3" /> Hard Wall
        </span>
      );
    }
    if (targetKey === 'ATS_SYNDICATION') {
      return (
        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/8 px-2 py-0.5 rounded-md border border-emerald-500/15">
          <Database className="w-3 h-3" /> ATS Direct
        </span>
      );
    }
    if (targetKey === 'WAF_SANDBOX') {
      return (
        <span className="text-[10px] text-rose-400 font-mono flex items-center gap-1 bg-rose-500/8 px-2 py-0.5 rounded-md border border-rose-500/15">
          <ShieldAlert className="w-3 h-3" /> WAF Active
        </span>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden animate-fade-in-up h-full">
      {/* Background ambient gradient */}
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-brand-500/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-sans">
            Ingestion Pipeline Controls
          </h2>
        </div>
        <span className="text-[10px] text-slate-500 font-mono bg-dark-800/60 px-2.5 py-1 rounded-md border border-white/[0.04]">
          Profile: {pacingProfile}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative">
        
        {/* Target Platform Selection */}
        <div>
          <label className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
            <span className="font-sans">Target Data Source / Login Wall Mode</span>
            {getTargetBadge()}
          </label>
          <select
            value={targetKey}
            disabled={isRunning}
            onChange={(e) => setTargetKey(e.target.value)}
            className="w-full bg-dark-800/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all font-sans disabled:opacity-50"
          >
            <optgroup label="🌐 Live Real Public Boards">
              <option value="REMOTEOK">🌐 RemoteOK (Live Real Public Source - Verified)</option>
              <option value="JOBICY">💼 Jobicy (Live Real Remote Board Feed)</option>
            </optgroup>
            
            <optgroup label="🔒 Login-Gated / Protected Platforms (Glassdoor/LinkedIn)">
              <option value="GLASSDOOR_SOFT_WALL">🔓 Glassdoor (Soft Login Wall / SEO JSON-LD Extraction)</option>
              <option value="GLASSDOOR_HARD_WALL">🔑 Glassdoor (Hard Login Wall / Authenticated SessionPool)</option>
              <option value="ATS_SYNDICATION">🏛️ Direct Public ATS Gateway (Greenhouse/Lever Syndication Bypass)</option>
            </optgroup>

            <optgroup label="🛡️ Anti-Bot Evasion Testing">
              <option value="WAF_SANDBOX">🛡️ Adversarial Anti-Bot WAF Sandbox (Tests 429/403/Stealth)</option>
            </optgroup>
          </select>
        </div>

        {/* Grid for Pacing & Batches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Pacing & Jitter Engine Profile */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2 font-sans">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pacing & Jitter Profile</span>
            </label>
            <select
              value={pacingProfile}
              disabled={isRunning}
              onChange={(e) => setPacingProfile(e.target.value)}
              className="w-full bg-dark-800/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all font-sans disabled:opacity-50"
            >
              <option value="HUMAN_STEALTH">Gaussian Human Dwell (~1.8s, Box-Muller Jitter)</option>
              <option value="PARANOID">Poisson Process Interval (~3.5s, High Evasion)</option>
              <option value="NORMAL">Standard Interval (600ms - 1200ms)</option>
              <option value="BURST">Aggressive Burst (50-150ms) ⚠️ Triggers WAF 429</option>
            </select>
          </div>

          {/* Batch Cycle Count */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2 font-sans">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span>Ingestion Cycles / Batches</span>
            </label>
            <select
              value={maxBatches}
              disabled={isRunning}
              onChange={(e) => setMaxBatches(e.target.value)}
              className="w-full bg-dark-800/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all font-sans disabled:opacity-50"
            >
              <option value="1">1 Batch Cycle</option>
              <option value="3">3 Batch Cycles (Default)</option>
              <option value="5">5 Batch Cycles</option>
              <option value="10">10 Batch Cycles</option>
            </select>
          </div>

        </div>

        {/* Stealth & Evasion Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Stealth Headers & Client Hints */}
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setStealthEnabled(!stealthEnabled)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
              stealthEnabled
                ? 'bg-gradient-to-r from-brand-500/10 to-brand-500/5 border-brand-500/25 text-brand-300'
                : 'bg-dark-800/60 border-white/[0.04] text-slate-400 hover:border-white/10'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 transition-colors ${stealthEnabled ? 'text-brand-400' : 'text-slate-500'}`} />
              <span className="font-sans text-left">Browser Fingerprint & Sec-CH-UA</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all ${
              stealthEnabled 
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20' 
                : 'bg-dark-800/80 text-slate-500'
            }`}>
              {stealthEnabled ? 'ENABLED' : 'OFF'}
            </span>
          </button>

          {/* Proxy & Identity Rotation */}
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setRotateIdentities(!rotateIdentities)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
              rotateIdentities
                ? 'bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border-cyan-500/25 text-cyan-300'
                : 'bg-dark-800/60 border-white/[0.04] text-slate-400 hover:border-white/10'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <RefreshCw className={`w-4 h-4 transition-colors ${rotateIdentities ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="font-sans text-left">Identity & Proxy Pool Rotation</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all ${
              rotateIdentities 
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20' 
                : 'bg-dark-800/80 text-slate-500'
            }`}>
              {rotateIdentities ? 'ENABLED' : 'OFF'}
            </span>
          </button>

        </div>

        {/* Action Button: Start / Stop */}
        <div className="pt-2">
          {isRunning ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4 fill-white" />
              )}
              <span className="font-sans">Stop Ingestion Pipeline</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 hover:from-brand-500 hover:via-brand-400 hover:to-indigo-400 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span className="font-sans">Launch Resilient Ingestion Run</span>
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
