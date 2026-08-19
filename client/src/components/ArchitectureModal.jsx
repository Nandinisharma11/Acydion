import React, { useState } from 'react';
import { X, ShieldAlert, Cpu, Network, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export function ArchitectureModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('detection');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="glass-panel bg-dark-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-850">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">System Architecture & Engineering Decisions</h2>
              <p className="text-xs text-slate-400">Design Document & Deep-Dive into Anti-Bot Evasion & Resilient Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-dark-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-dark-800/60 px-6 gap-2 text-xs font-mono">
          {[
            { id: 'detection', label: '1. Detection Surface', icon: ShieldAlert },
            { id: 'strategy', label: '2. Ingestion Strategy', icon: Network },
            { id: 'resilience', label: '3. Resilience & Drift', icon: Cpu },
            { id: 'ethics', label: '4. Ethical Stop Line', icon: AlertTriangle },
            { id: 'decisions', label: '5. Decisions.md', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-300 bg-brand-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          
          {/* TAB 1: DETECTION SURFACE */}
          {activeTab === 'detection' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                What Gives Automated Scrapers Away
              </h3>
              <p className="text-xs text-slate-400">
                Modern anti-bot solutions (Cloudflare Bot Management, Datadome, Akamai, PerimeterX) inspect far more than just your User-Agent:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-cyan-400 font-mono">1. TLS & JA3/JA4 Fingerprints</h4>
                  <p className="text-xs text-slate-300">
                    Node's standard TLS client negotiates ciphers and extensions in a known fixed order that instantly flags requests as automated. Modern WAFs compare your TLS signature against the User-Agent header.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-brand-400 font-mono">2. Missing Client-Hints (Sec-CH-UA)</h4>
                  <p className="text-xs text-slate-300">
                    If your User-Agent claims to be Chrome 120+ but lacks <code className="text-brand-300">sec-ch-ua-platform</code> and <code className="text-brand-300">sec-fetch-dest: document</code>, WAFs reject the request on sight.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-400 font-mono">3. Headless Browser Artifacts</h4>
                  <p className="text-xs text-slate-300">
                    Standard Puppeteer leaves <code className="text-amber-300">navigator.webdriver = true</code>, unmasked WebGL renderers (SwiftShader), empty audio contexts, and missing <code className="text-amber-300">window.chrome</code> runtimes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-rose-400 font-mono">4. Robotic Request Cadence</h4>
                  <p className="text-xs text-slate-300">
                    Fixed request intervals (e.g. exactly 1000ms ± 0ms) produce distinct spikes in FFT / frequency analysis. Humans follow Poisson and Gaussian dwell distributions with micro-jitter.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INGESTION STRATEGY */}
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-brand-400" />
                The Multi-Tier Ingestion Strategy Ladder
              </h3>
              <p className="text-xs text-slate-400">
                Never pay the cost of headless browsers when lightweight stealth HTTP suffices, but never fail when dynamic challenges arise.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">TIER 1</span>
                  <div>
                    <span className="font-bold text-emerald-200 block font-sans">Stealth HTTP Client with Client-Hints</span>
                    <span className="text-[11px] text-slate-300 font-sans">Fastest (~80ms). Rotates full browser profiles (Chrome macOS/Win, Safari) with authentic header casing and cookie persistence.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold shrink-0">TIER 2</span>
                  <div>
                    <span className="font-bold text-cyan-200 block font-sans">Stealth Headless Browser (JS-Heavy / Challenge Pages)</span>
                    <span className="text-[11px] text-slate-300 font-sans">Masks automation flags, injects WebGL & audio noise, and executes randomized Bezier mouse trajectories to pass proof-of-work.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold shrink-0">TIER 3</span>
                  <div>
                    <span className="font-bold text-brand-200 block font-sans">Residential Proxy & Identity Pool Rotation</span>
                    <span className="text-[11px] text-slate-300 font-sans">Rotates egress IP per batch through residential pools (US-East, EU-West) when rate-limits or geographic geofences are tripped.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESILIENCE */}
          {activeTab === 'resilience' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Resilience & Schema Drift Mitigation
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1">
                  <h4 className="font-bold text-white font-mono">1. Circuit Breaker State Machine</h4>
                  <p className="text-slate-300">
                    Immediately trips to <strong>OPEN</strong> upon receiving a 429 or 403, preventing subsequent requests from burning IPs or accounts. After a cooldown window (7s), enters <strong>HALF_OPEN</strong> to test canary probes before resuming full throughput.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1">
                  <h4 className="font-bold text-white font-mono">2. Adaptive Multi-Selector Fallback & Schema Drift Scoring</h4>
                  <p className="text-slate-300">
                    When CSS classes change overnight, the parser cascades from <strong>JSON-LD</strong> → <strong>Primary Selectors</strong> → <strong>Fuzzy Regex DOM Topology</strong>. It computes a DOM confidence score and triggers an alert so engineers can review without pipeline crashes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1">
                  <h4 className="font-bold text-white font-mono">3. Dead Letter Queue (DLQ) with Exponential Backoff</h4>
                  <p className="text-slate-300">
                    Quarantines failed payloads with retry timestamps: <code className="text-cyan-300 font-mono">delay = base * 2^attempts + jitter</code>. Allows automatic retry or operator re-drive.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ETHICAL STOP LINE */}
          {activeTab === 'ethics' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Ethical & Technical Boundaries: Where We Stop
              </h3>

              <div className="p-4 rounded-xl bg-dark-800 border border-white/5 space-y-3 text-xs">
                <p className="text-slate-200 leading-relaxed">
                  Every platform has Terms of Service prohibiting scraping. Our technical and personal line is defined by the following four non-negotiable engineering principles:
                </p>

                <ul className="space-y-2 text-slate-300 list-disc pl-4">
                  <li><strong>Zero PII Collection:</strong> We scrape public role postings, compensation bands, and company listings. We strictly ignore personal user profiles, candidate identities, or private messaging endpoints.</li>
                  <li><strong>Respectful Egress Rates (No DoS):</strong> Even with evasion techniques enabled, our rate is clamped to low frequencies with Gaussian human pacing. We never hammer an origin server or cause infrastructure degradation.</li>
                  <li><strong>No Credential Stuffing / Authenticated Account Scraping:</strong> We operate against publicly accessible data surfaces and unauthenticated search indices. We do not use burner account credentials or bypass authenticated auth walls.</li>
                  <li><strong>Scope Guardrail Compliance:</strong> Real live tests run against open public job feeds (e.g. RemoteOK, Jobicy), and adversarial anti-bot testing runs against a controlled WAF sandbox.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: DECISIONS.MD */}
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Written Explanation (DECISIONS.md)
              </h3>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-brand-300">1. Why this ingestion strategy over the obvious alternative rejected?</h4>
                  <p className="text-slate-300">
                    The obvious alternative is spinning up 50 headless Chromium instances running raw Playwright. We rejected that because it is resource-intensive (heavy memory/CPU), slow, and ironically <em>easier</em> for modern WAFs to detect due to missing TLS entropy and unmasked WebGL/Canvas hooks. Instead, we built a <strong>Multi-Tiered Ladder</strong>: Fast Stealth HTTP with authentic Client-Hints and Gaussian pacing for 95% of throughput, with dynamic headless browsers only engaged as a secondary fallback.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-cyan-300">2. One trade-off made under the time limit, and what to do with a real week?</h4>
                  <p className="text-slate-300">
                    <strong>Trade-off:</strong> Used an in-memory sliding window for the Circuit Breaker and DLQ instead of a distributed Redis / Kafka queue cluster.
                    <br />
                    <strong>With a real week:</strong> Implement distributed Redis-backed sliding-window token buckets, custom native TLS JA4 cipher permutation proxies (using Go/uTLS), and auto-tuning machine-learning DOM healing to automatically fix altered selectors without human code intervention.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-dark-800 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-amber-300">3. Where did you use AI tools, and what did you personally verify or change afterward?</h4>
                  <p className="text-slate-300">
                    AI was used for rapid scaffolding of CSS tokens, regex patterns for salary extraction, and Box-Muller transform helper skeletons.
                    <br />
                    <strong>Personally verified & changed:</strong> Hand-crafted the Circuit Breaker state transitions (`CLOSED` → `OPEN` on immediate 429/403 vs sliding window), verified the exact Client-Hints syntax (`sec-ch-ua-platform`), debugged SSE heartbeat connection cleanup, and validated that the Box-Muller jitter avoids floating-point robotic periodicity.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-dark-850 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Acdyon Technologies Engineering Submission</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-sans text-xs font-medium cursor-pointer"
          >
            Done Reading
          </button>
        </div>

      </div>
    </div>
  );
}
