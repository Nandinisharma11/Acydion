import React, { useState } from 'react';
import { Search, Download, Trash2, ExternalLink, Code, Sparkles, Building2, MapPin, DollarSign, Tag, X, FileJson, FileSpreadsheet } from 'lucide-react';

export function JobListingsTable({ jobs = [], onClear }) {
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const filteredJobs = jobs.filter(job => {
    const term = search.toLowerCase();
    return (
      job.title?.toLowerCase().includes(term) ||
      job.company?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term) ||
      (job.tags && job.tags.some(t => t.toLowerCase().includes(term)))
    );
  });

  const exportToJson = () => {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acydion-extracted-jobs-${Date.now()}.json`;
    a.click();
  };

  const exportToCsv = () => {
    if (!jobs.length) return;
    const headers = ['ID', 'Title', 'Company', 'Location', 'Salary', 'Tags', 'URL', 'Method', 'Timestamp'];
    const rows = jobs.map(j => [
      `"${j.id}"`,
      `"${(j.title || '').replace(/"/g, '""')}"`,
      `"${(j.company || '').replace(/"/g, '""')}"`,
      `"${(j.location || '').replace(/"/g, '""')}"`,
      `"${(j.salary || '').replace(/"/g, '""')}"`,
      `"${(j.tags || []).join(';')}"`,
      `"${j.url || ''}"`,
      `"${j.extractionMethod || ''}"`,
      `"${j.timestamp || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acydion-extracted-jobs-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="glass-panel rounded-2xl p-6 animate-fade-in-up">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-sans">
                Extracted Job Data
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {filteredJobs.length} records • Structured & normalized from live egress
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, company, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-dark-800/60 border border-white/[0.04] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500/40 w-56 transition-all font-sans placeholder:text-slate-600"
            />
          </div>

          {/* Export Buttons */}
          <button
            onClick={exportToJson}
            disabled={!jobs.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-800/60 hover:bg-dark-800 border border-white/[0.04] hover:border-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all disabled:opacity-30 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={exportToCsv}
            disabled={!jobs.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-800/60 hover:bg-dark-800 border border-white/[0.04] hover:border-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all disabled:opacity-30 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
          </button>

          {/* Clear Button */}
          {jobs.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/15 hover:border-rose-500/25 text-rose-400 text-xs font-mono transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.04] bg-dark-800/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-800/60 text-slate-500 font-mono uppercase text-[10px] border-b border-white/[0.04] tracking-wider">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Role / Title</th>
              <th className="px-5 py-3.5 font-semibold">Company</th>
              <th className="px-5 py-3.5 font-semibold">Location & Salary</th>
              <th className="px-5 py-3.5 font-semibold">Tags</th>
              <th className="px-5 py-3.5 font-semibold">Ingestion Method</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03] font-sans">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center text-slate-600 italic">
                  <div className="space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-700" />
                    <p>{jobs.length === 0 ? 'No listings extracted yet. Launch an ingestion job to pull live listings.' : 'No listings matching search query.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="px-5 py-3.5 font-semibold text-slate-100 max-w-xs">
                    <div className="truncate group-hover:text-brand-300 transition-colors">{job.title}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 max-w-[160px]">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-cyan-400/70 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/80">
                        <DollarSign className="w-3 h-3 shrink-0" />
                        <span>{job.salary}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(job.tags || []).slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-dark-800/60 text-slate-400 border border-white/[0.04] text-[10px] font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-md bg-brand-500/8 text-brand-300 border border-brand-500/15 text-[10px] font-mono font-semibold">
                      {job.extractionMethod || 'Adaptive Parser'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedJob(job)}
                        title="View Raw JSON"
                        className="p-2 rounded-lg bg-dark-800/40 hover:bg-dark-800 text-slate-500 hover:text-slate-200 border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      {job.url && job.url !== '#' && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Link"
                          className="p-2 rounded-lg bg-dark-800/40 hover:bg-dark-800 text-slate-500 hover:text-slate-200 border border-white/[0.04] hover:border-white/10 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Raw JSON Inspect Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedJob(null)}>
          <div className="glass-panel bg-[#070b14] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="text-sm font-semibold font-mono text-slate-200 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/15 flex items-center justify-center">
                  <Code className="w-3.5 h-3.5 text-brand-400" />
                </div>
                Raw Ingested Record ({selectedJob.id})
              </h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg bg-dark-800/60 text-slate-400 hover:text-white hover:bg-dark-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="terminal-bg p-5 rounded-xl text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-96 leading-relaxed">
              {JSON.stringify(selectedJob, null, 2)}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
