import React from 'react';
import { GitCompare, CheckCircle2, AlertOctagon, Sparkles, Database } from 'lucide-react';

export function SchemaDriftMatrix({ driftHistory = [] }) {
  const latestDrift = driftHistory.length > 0 ? driftHistory[driftHistory.length - 1] : null;

  const tiers = [
    {
      icon: Database,
      iconColor: 'text-emerald-400',
      title: 'Tier 1: JSON-LD / schema.org Microdata',
      desc: 'Immune to CSS class renames & DOM mutations',
      confidence: 1.0,
      confColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
    },
    {
      icon: CheckCircle2,
      iconColor: 'text-brand-400',
      title: 'Tier 2: Primary Target Selectors',
      desc: 'Class mapping (.job-card, .title, .company)',
      confidence: 0.95,
      confColor: 'bg-brand-500/10 text-brand-400 border-brand-500/15'
    },
    {
      icon: Sparkles,
      iconColor: 'text-amber-400',
      title: 'Tier 3: Heuristic Fuzzy Structural Parser',
      desc: 'Recovers data when markup changes overnight',
      confidence: 0.72,
      confColor: 'bg-amber-500/10 text-amber-400 border-amber-500/15'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between animate-fade-in-up h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-sans">
              Adaptive Parsing & Drift Matrix
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-cyan-500/8 text-cyan-400 border border-cyan-500/15 font-semibold">
            3-Tier Fallback Ladder
          </span>
        </div>

        {/* Strategies Visualization */}
        <div className="space-y-2.5 mb-5">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <div 
                key={index}
                className="p-3 rounded-xl bg-dark-800/50 border border-white/[0.04] flex items-center justify-between text-xs group hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${tier.iconColor} shrink-0`} />
                  <div>
                    <span className="font-medium text-slate-200 block text-[12px]">{tier.title}</span>
                    <span className="text-[10px] text-slate-500">{tier.desc}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md border font-mono text-[10px] font-semibold shrink-0 ml-3 ${tier.confColor}`}>
                  {tier.confidence.toFixed(2)} Conf.
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drift Status Footer */}
      <div className="pt-3.5 border-t border-white/[0.04]">
        {latestDrift && latestDrift.driftDetected ? (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5 font-mono">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">DOM Drift Detected: {latestDrift.details}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-2 text-emerald-400/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              DOM Stability: Nominal
            </span>
            <span className="text-slate-500">0 Silent Failures</span>
          </div>
        )}
      </div>
    </div>
  );
}
