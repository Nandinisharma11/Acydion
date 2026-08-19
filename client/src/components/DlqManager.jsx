import React from 'react';
import { AlertOctagon, RotateCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export function DlqManager({ dlqMetrics, dlqItems = [], onRetryAll, onRetryItem }) {
  const pendingCount = dlqMetrics?.pending || 0;

  return (
    <div className="glass-panel rounded-2xl p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-sans">
            Dead Letter Queue (DLQ) & Quarantine Manager
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">
            Pending Retries: <span className="font-bold text-amber-400">{pendingCount}</span>
          </span>
          {dlqItems.length > 0 && (
            <button
              onClick={onRetryAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/8 hover:bg-amber-500/15 text-amber-300 border border-amber-500/15 hover:border-amber-500/25 text-xs font-mono transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Re-drive All Quarantined
            </button>
          )}
        </div>
      </div>

      {dlqItems.length === 0 ? (
        <div className="p-6 rounded-xl bg-dark-800/30 border border-white/[0.04] text-center text-xs text-slate-500 font-mono space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
          <p>Zero quarantined requests. Ingestion egress health is 100%.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dlqItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-dark-800/40 border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:border-white/10 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-200 font-semibold">{item.target}</span>
                  <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-semibold ${
                    item.status === 'RESOLVED' 
                      ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/15' 
                      : 'bg-amber-500/8 text-amber-300 border-amber-500/15'
                  }`}>
                    {item.status} ({item.attempts}/{item.maxRetries})
                  </span>
                </div>
                <div className="text-[11px] text-rose-400/80 truncate">
                  Error: {item.errorReason}
                </div>
              </div>

              {item.status !== 'RESOLVED' && (
                <button
                  onClick={() => onRetryItem(item.id)}
                  className="px-4 py-1.5 rounded-lg bg-dark-800/60 hover:bg-dark-800 text-slate-300 text-[11px] border border-white/[0.06] hover:border-white/15 shrink-0 cursor-pointer transition-all"
                >
                  Retry Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
