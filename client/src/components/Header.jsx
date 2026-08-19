import React from 'react';
import { Shield, Activity, Terminal, BookOpen, Wifi, Layers, Database, Sparkles, Sliders } from 'lucide-react';

export function Header({ activeTab, onTabChange, isRunning, onOpenDocs, activeProxy, onTriggerEasterEgg }) {
  const navTabs = [
    { id: 'control', label: 'Live Ingestion Hub', icon: Activity },
    { id: 'jobs', label: 'Extracted Intelligence', icon: Database },
    { id: 'defense', label: 'Anti-Bot Defense Lab', icon: Shield },
    { id: 'resilience', label: 'Resilience Matrix & DLQ', icon: Layers },
    { id: 'docs', label: 'Architecture & Decisions', icon: BookOpen }
  ];

  return (
    <header className="border-b border-white/[0.04] bg-gradient-to-b from-[#0a0e18]/95 to-[#070b13]/95 backdrop-blur-2xl sticky top-0 z-40 transition-all">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
        
        {/* Top row: Brand + Status */}
        <div className="flex items-center justify-between py-3.5">
          
          {/* Brand & System Title */}
          <div className="flex items-center gap-4">
            <div 
              onClick={onTriggerEasterEgg}
              title="Acdyon Core System (Click for Easter Egg)"
              className="relative cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 group-hover:scale-110 transition-all duration-300">
                <Shield className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
              {isRunning && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#070b13] shadow-sm shadow-emerald-400/50"></span>
                </span>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2.5 font-mono">
                  ACYDION
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-500/15 to-indigo-500/15 text-brand-300 border border-brand-500/25 font-mono font-semibold tracking-wider">
                    V1.0 PROD
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400/80 font-sans tracking-wide mt-0.5">
                Production-Grade Resilient Ingestion & Anti-Bot Evasion Engine
              </p>
            </div>
          </div>

          {/* Live Status Indicators */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Egress Node Indicator */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-dark-800/60 border border-white/[0.04] text-xs backdrop-blur-sm">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-500 font-sans">Egress:</span>
              <span className="font-mono text-cyan-300 font-semibold">{activeProxy?.name || 'Direct Egress (Local Host)'}</span>
              <span className="text-[10px] font-mono text-slate-500 bg-dark-800/80 px-1.5 py-0.5 rounded">
                {activeProxy?.latency || '12ms'}
              </span>
            </div>

            {/* Engine State Indicator */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-semibold transition-all duration-500 ${
              isRunning 
                ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/25 text-emerald-400 shadow-sm shadow-emerald-500/10'
                : 'bg-dark-800/40 border-white/[0.04] text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full transition-all ${isRunning ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-slate-600'}`} />
              {isRunning ? 'PIPELINE ACTIVE' : 'PIPELINE IDLE'}
            </div>
          </div>
        </div>

        {/* Bottom row: Tab Navigation */}
        <nav className="flex items-center gap-0.5 -mb-px overflow-x-auto pb-0 scrollbar-none">
          {navTabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => tab.id === 'docs' ? onOpenDocs() : onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-brand-400' : ''}`} />
                <span className="font-sans">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 rounded-full shadow-sm shadow-brand-500/50" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
