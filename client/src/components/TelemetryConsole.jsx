import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, CheckCircle2, AlertTriangle, XCircle, Filter, Trash2 } from 'lucide-react';

export function TelemetryConsole({ logs = [], stats, onClear }) {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel.toLowerCase();
  });

  const getLevelBadge = (level) => {
    const styles = {
      success: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15',
      warn: 'text-amber-400 bg-amber-500/8 border-amber-500/15',
      error: 'text-rose-400 bg-rose-500/8 border-rose-500/15',
      info: 'text-cyan-400 bg-cyan-500/8 border-cyan-500/15'
    };
    const labels = { success: 'OK', warn: 'WARN', error: 'FAIL', info: 'INFO' };
    const style = styles[level] || styles.info;
    const label = labels[level] || 'INFO';
    return (
      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border font-semibold tracking-wider ${style}`}>
        {label}
      </span>
    );
  };

  const statItems = [
    { label: 'Total Requests', value: stats?.totalRequests || 0, color: 'text-slate-200' },
    { label: 'Success Rate', value: `${stats?.totalRequests > 0 ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 100}%`, color: 'text-emerald-400' },
    { label: 'WAF Bypasses', value: stats?.wafBlocksBypassed || 0, color: 'text-cyan-400' },
    { label: 'Avg Latency', value: `${stats?.averageLatencyMs || 0}ms`, color: 'text-slate-300' },
    { label: 'Extracted Jobs', value: stats?.totalJobsExtracted || 0, color: 'text-brand-400' }
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-[480px] animate-fade-in-up">
      
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-sans">
            Live Pipeline Telemetry
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/8 text-emerald-400 border border-emerald-500/15 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SSE Connected
          </span>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5 bg-dark-800/60 p-1 rounded-lg border border-white/[0.04] text-xs font-mono">
            {['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-md text-[10px] transition-all cursor-pointer font-semibold ${
                  filterLevel === lvl 
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-500 font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-dark-800 border-white/10 text-brand-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px]">Auto-Scroll</span>
          </label>
        </div>
      </div>

      {/* Terminal Log Area */}
      <div className="flex-1 overflow-y-auto font-mono text-xs p-4 terminal-bg rounded-xl my-4 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic font-sans text-sm">
            <div className="text-center space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-slate-700" />
              <p>Telemetry stream active. Launch an ingestion job to stream live request signatures.</p>
            </div>
          </div>
        ) : (
          filteredLogs.slice().reverse().map((log) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            return (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-white/[0.015] p-1.5 rounded-lg transition-colors group">
                <span className="text-slate-600 select-none text-[10px] shrink-0 mt-0.5 tabular-nums">{time}</span>
                <span className="shrink-0 mt-0.5">{getLevelBadge(log.level)}</span>
                <span className="text-slate-500 font-semibold shrink-0 text-[11px]">[{log.category}]</span>
                <span className={`break-all text-[11px] ${
                  log.level === 'error' ? 'text-rose-300/90' :
                  log.level === 'warn' ? 'text-amber-300/90' :
                  log.level === 'success' ? 'text-emerald-300/90' : 'text-slate-400'
                }`}>
                  {log.message}
                </span>
                {log.metadata?.delayMs && (
                  <span className="text-[9px] text-cyan-400/70 bg-cyan-500/8 px-1.5 py-0.5 rounded border border-cyan-500/10 shrink-0 font-semibold">
                    +{log.metadata.delayMs}ms
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Real-Time Pipeline Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center font-mono text-xs">
        {statItems.map((item, idx) => (
          <div 
            key={idx} 
            className={`bg-dark-800/40 p-2.5 rounded-xl border border-white/[0.04] hover:border-white/10 transition-all ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <span className="text-[9px] text-slate-500 block mb-0.5 uppercase tracking-wider">{item.label}</span>
            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
