import React from 'react';
import { Zap, RotateCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function CircuitBreakerCard({ metrics, onReset }) {
  const state = metrics?.state || 'CLOSED';
  const failureRate = metrics?.failureRatePercent || 0;
  const cooldownRemaining = Math.ceil((metrics?.cooldownRemainingMs || 0) / 1000);

  const getStateBadge = () => {
    switch (state) {
      case 'CLOSED':
        return {
          bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400',
          label: 'CLOSED (Healthy / Operational)',
          desc: 'Requests passing freely. Monitoring sliding failure window.'
        };
      case 'OPEN':
        return {
          bg: 'bg-gradient-to-br from-rose-500/12 to-rose-500/5 text-rose-400 border-rose-500/25',
          dot: 'bg-rose-400 animate-ping',
          label: 'TRIPPED (OPEN - Egress Blocked)',
          desc: 'Target rate limit/WAF detected. Pipeline paused to prevent IP burning.'
        };
      case 'HALF_OPEN':
        return {
          bg: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400 animate-pulse',
          label: 'HALF_OPEN (Probe Canary Active)',
          desc: 'Testing target with low-frequency probe requests to verify recovery.'
        };
      default:
        return { bg: 'bg-dark-800/60 text-slate-400', dot: 'bg-slate-400', label: state, desc: '' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between animate-fade-in-up h-full">
      {/* Subtle ambient glow based on state */}
      {state === 'OPEN' && (
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-500/[0.08] rounded-full blur-3xl pointer-events-none" />
      )}

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-sans">
              Circuit Breaker State Machine
            </h2>
          </div>
          <button
            onClick={onReset}
            title="Force Reset to CLOSED state"
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-dark-800/60 hover:bg-dark-800 px-3 py-1.5 rounded-lg border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* State Banner */}
        <div className={`p-4 rounded-xl border mb-5 flex items-start gap-3.5 transition-all ${badge.bg}`}>
          <span className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${badge.dot}`} />
          <div className="space-y-1.5">
            <div className="text-xs font-bold font-mono tracking-wide flex items-center gap-2">
              {badge.label}
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed font-sans">{badge.desc}</p>
            {state === 'OPEN' && cooldownRemaining > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300 pt-1">
                <Clock className="w-3.5 h-3.5" /> Auto-Probe in {cooldownRemaining}s
              </div>
            )}
          </div>
        </div>

        {/* Sliding Window Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-dark-800/50 p-3.5 rounded-xl border border-white/[0.04] group hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1 tracking-wider">Failure Rate</span>
            <span className={`text-lg font-bold font-mono ${failureRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {failureRate}%
            </span>
          </div>

          <div className="bg-dark-800/50 p-3.5 rounded-xl border border-white/[0.04] group hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1 tracking-wider">Tripped Total</span>
            <span className="text-lg font-bold font-mono text-slate-200">
              {metrics?.totalTrippedCount || 0}x
            </span>
          </div>

          <div className="bg-dark-800/50 p-3.5 rounded-xl border border-white/[0.04] group hover:border-white/10 transition-all">
            <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1 tracking-wider">Canary Progress</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {metrics?.halfOpenSuccessCount || 0}/{metrics?.halfOpenSuccessRequired || 2}
            </span>
          </div>
        </div>
      </div>

      {metrics?.lastFailureReason && (
        <div className="mt-5 pt-3.5 border-t border-white/[0.04] text-[11px] text-slate-400 font-mono truncate flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Last Fault: {metrics.lastFailureReason}</span>
        </div>
      )}
    </div>
  );
}
