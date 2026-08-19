import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Zap, Lock, Unlock, Play, RefreshCw, Terminal, CheckCircle2, AlertTriangle, Code, Database, Loader2 } from 'lucide-react';

export function DefenseLabView({ onStartExperiment }) {
  const [activeExp, setActiveExp] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const experiments = [
    {
      id: 'burst_test',
      title: '1. Rate-Limit Anomaly Test (429 Trigger & Circuit Trip)',
      desc: 'Fires high-speed requests (<100ms) without Gaussian jitter to intentionally trigger WAF sliding-window rate limits and demonstrate automatic Circuit Breaker tripping.',
      targetKey: 'WAF_SANDBOX',
      pacingProfile: 'BURST',
      stealthEnabled: true,
      expectedOutcome: 'HTTP 429 Too Many Requests → Circuit trips to OPEN → 7s Cooldown engaged',
      tag: 'Rate Limiting',
      color: 'amber',
      iconBg: 'bg-amber-500/10 border-amber-500/15',
      iconColor: 'text-amber-400'
    },
    {
      id: 'client_hints_test',
      title: '2. Client-Hints Inspection Test (403 Detection)',
      desc: 'Disables Sec-CH-UA browser headers while sending a Chrome 122 User-Agent to demonstrate how modern Cloudflare/Datadome WAFs flag inconsistent automation signatures.',
      targetKey: 'WAF_SANDBOX',
      pacingProfile: 'NORMAL',
      stealthEnabled: false,
      expectedOutcome: 'HTTP 403 Forbidden → Bot Signature Flagged → Quarantined in DLQ',
      tag: 'Fingerprinting',
      color: 'rose',
      iconBg: 'bg-rose-500/10 border-rose-500/15',
      iconColor: 'text-rose-400'
    },
    {
      id: 'soft_wall_test',
      title: '3. Soft Login Wall SEO Bypass (Glassdoor/Indeed)',
      desc: 'Hits a page locked with a visual signup modal overlay. Demonstrates schema.org/JobPosting JSON-LD extraction and Google-Referer spoofing.',
      targetKey: 'GLASSDOOR_SOFT_WALL',
      pacingProfile: 'HUMAN_STEALTH',
      stealthEnabled: true,
      expectedOutcome: 'HTTP 200 OK → Modal ignored → Full job entities parsed via Tier 1 JSON-LD',
      tag: 'SEO Schema',
      color: 'cyan',
      iconBg: 'bg-cyan-500/10 border-cyan-500/15',
      iconColor: 'text-cyan-400'
    },
    {
      id: 'hard_wall_test',
      title: '4. Hard Login Wall & Session Cookie Pool (LinkedIn/Glassdoor)',
      desc: 'Tests an endpoint strictly requiring an active authenticated session token. Injects pre-warmed cookies (gd_session) from SessionPool.',
      targetKey: 'GLASSDOOR_HARD_WALL',
      pacingProfile: 'HUMAN_STEALTH',
      stealthEnabled: true,
      expectedOutcome: 'HTTP 200 OK → Authenticated session validated → Private listing entities returned',
      tag: 'SessionPool',
      color: 'indigo',
      iconBg: 'bg-brand-500/10 border-brand-500/15',
      iconColor: 'text-brand-400'
    },
    {
      id: 'ats_syndication_test',
      title: '5. Direct ATS Gateway Syndication (Plan B Fallback)',
      desc: 'Bypasses aggregators entirely by routing directly into open ATS feeds (Greenhouse/Lever) when primary web platforms change markup or rate-limit.',
      targetKey: 'ATS_SYNDICATION',
      pacingProfile: 'HUMAN_STEALTH',
      stealthEnabled: true,
      expectedOutcome: 'HTTP 200 OK → Zero login required → Real-time requisition feed extracted',
      tag: 'Plan B Fallback',
      color: 'emerald',
      iconBg: 'bg-emerald-500/10 border-emerald-500/15',
      iconColor: 'text-emerald-400'
    }
  ];

  const handleRunExperiment = async (exp) => {
    setActiveExp(exp.id);
    setRunning(true);
    setResult(null);

    await onStartExperiment({
      targetKey: exp.targetKey,
      pacingProfile: exp.pacingProfile,
      stealthEnabled: exp.stealthEnabled,
      rotateIdentities: true,
      maxBatches: 1
    });

    setRunning(false);
    setResult({
      expId: exp.id,
      timestamp: new Date().toLocaleTimeString(),
      status: 'DISPATCHED_TO_PIPELINE',
      message: `Experiment "${exp.title}" dispatched. Check live telemetry console and data explorer below.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-sm shadow-brand-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-sans tracking-tight">Anti-Bot Defense & Evasion Laboratory</h2>
            <p className="text-xs text-slate-400/80 mt-0.5">Interactive live workbench to test WAF triggers, login walls, and bypass countermeasures</p>
          </div>
        </div>
      </div>

      {/* Grid of Experiments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experiments.map((exp) => {
          const isSelected = activeExp === exp.id;
          return (
            <div
              key={exp.id}
              className={`glass-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 border transition-all duration-300 ${
                isSelected ? 'border-brand-500/40 shadow-glow-indigo' : 'border-white/[0.04]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md ${exp.iconBg} border ${exp.iconColor} font-semibold tracking-wider`}>
                    {exp.tag}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">Target: {exp.targetKey}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 font-sans leading-snug">{exp.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{exp.desc}</p>

                <div className="p-3 rounded-xl bg-dark-800/50 border border-white/[0.04] space-y-1.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block font-semibold tracking-widest">Expected System Response</span>
                  <p className="text-[11px] font-mono text-cyan-300/80 leading-relaxed">{exp.expectedOutcome}</p>
                </div>
              </div>

              <button
                onClick={() => handleRunExperiment(exp)}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold font-sans transition-all shadow-md shadow-brand-600/15 hover:shadow-brand-600/25 disabled:opacity-40 cursor-pointer"
              >
                {running && activeExp === exp.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>Execute Experiment</span>
              </button>
            </div>
          );
        })}
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{result.message}</span>
        </div>
      )}

    </div>
  );
}
