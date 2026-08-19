import React from 'react';
import { Database, ShieldCheck, Activity, Zap, Clock, TrendingUp, CheckCircle2, ArrowUpRight } from 'lucide-react';

export function QuickMetricsBar({ stats, circuitBreaker, totalJobs }) {
  const successRate = stats?.totalRequests > 0 
    ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) 
    : 100;
  
  const totalBypassed = (stats?.wafBlocksBypassed || 0) + (stats?.loginWallsBypassed || 0);

  const metrics = [
    {
      label: 'Ingested Intelligence',
      value: totalJobs || 0,
      suffix: null,
      badge: { text: 'Live', color: 'emerald' },
      sublabel: 'Structured normalized entities',
      icon: Database,
      accentColor: 'brand',
      glowClass: ''
    },
    {
      label: 'Pipeline Health Rate',
      value: `${successRate}%`,
      suffix: `(${stats?.successfulRequests || 0}/${stats?.totalRequests || 0})`,
      badge: null,
      sublabel: 'Sliding error tolerance nominal',
      icon: CheckCircle2,
      accentColor: 'emerald',
      glowClass: successRate >= 95 ? '' : ''
    },
    {
      label: 'Wall & WAF Bypasses',
      value: totalBypassed,
      suffix: null,
      badge: { text: 'Clean Egress', color: 'cyan' },
      sublabel: 'Client-Hints & SessionPool active',
      icon: ShieldCheck,
      accentColor: 'cyan',
      glowClass: ''
    },
    {
      label: 'Circuit State & Latency',
      value: circuitBreaker?.state || 'CLOSED',
      suffix: `~${stats?.averageLatencyMs || 0}ms`,
      badge: null,
      sublabel: circuitBreaker?.state === 'OPEN' 
        ? `Cooldown ${Math.ceil((circuitBreaker?.cooldownRemainingMs || 0)/1000)}s` 
        : 'Zero IP burns recorded',
      icon: Zap,
      accentColor: circuitBreaker?.state === 'OPEN' ? 'rose' : 'amber',
      glowClass: circuitBreaker?.state === 'OPEN' ? 'shadow-glow-rose' : ''
    }
  ];

  const colorMap = {
    brand: {
      iconBg: 'bg-brand-500/10',
      iconBorder: 'border-brand-500/20',
      iconText: 'text-brand-400',
      valueText: 'text-white'
    },
    emerald: {
      iconBg: 'bg-emerald-500/8',
      iconBorder: 'border-emerald-500/15',
      iconText: 'text-emerald-400',
      valueText: 'text-emerald-400'
    },
    cyan: {
      iconBg: 'bg-cyan-500/8',
      iconBorder: 'border-cyan-500/15',
      iconText: 'text-cyan-400',
      valueText: 'text-cyan-300'
    },
    amber: {
      iconBg: 'bg-amber-500/8',
      iconBorder: 'border-amber-500/15',
      iconText: 'text-amber-400',
      valueText: 'text-slate-100'
    },
    rose: {
      iconBg: 'bg-rose-500/10',
      iconBorder: 'border-rose-500/20',
      iconText: 'text-rose-400',
      valueText: 'text-rose-400'
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
      {metrics.map((m, index) => {
        const Icon = m.icon;
        const colors = colorMap[m.accentColor];
        return (
          <div
            key={m.label}
            className={`glass-card-interactive rounded-2xl p-5 flex items-start justify-between group stagger-${index + 1} ${m.glowClass}`}
          >
            <div className="space-y-2 min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-slate-500 font-semibold block">
                {m.label}
              </span>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className={`text-2xl font-extrabold font-mono tracking-tight ${colors.valueText}`}>
                  {m.value}
                </span>
                {m.suffix && (
                  <span className="text-[11px] font-mono text-slate-500">{m.suffix}</span>
                )}
                {m.badge && (
                  <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 text-${m.badge.color}-400`}>
                    <ArrowUpRight className="w-3 h-3" />
                    {m.badge.text}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block">{m.sublabel}</span>
            </div>
            <div className={`w-11 h-11 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center ${colors.iconText} shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
