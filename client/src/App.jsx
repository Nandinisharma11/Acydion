import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { QuickMetricsBar } from './components/QuickMetricsBar';
import { ControlPanel } from './components/ControlPanel';
import { CircuitBreakerCard } from './components/CircuitBreakerCard';
import { SchemaDriftMatrix } from './components/SchemaDriftMatrix';
import { TelemetryConsole } from './components/TelemetryConsole';
import { JobListingsTable } from './components/JobListingsTable';
import { DlqManager } from './components/DlqManager';
import { DefenseLabView } from './components/DefenseLabView';
import { ArchitectureModal } from './components/ArchitectureModal';
import { EasterEggModal } from './components/EasterEggModal';
import {
  fetchStatus,
  startScrape,
  stopScrape,
  fetchJobs,
  clearJobs,
  resetCircuitBreaker,
  retryDlq
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('control'); // 'control', 'jobs', 'defense', 'resilience'
  const [telemetry, setTelemetry] = useState(null);
  const [logs, setLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [dlqItems, setDlqItems] = useState([]);
  const [showDocs, setShowDocs] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [activeProxy, setActiveProxy] = useState(null);

  // Konami Code Sequence: Up, Up, Down, Down, Left, Right, Left, Right, b, a
  const [konamiIndex, setKonamiIndex] = useState(0);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === konamiCode[konamiIndex]) {
        const nextIndex = konamiIndex + 1;
        if (nextIndex === konamiCode.length) {
          setShowEasterEgg(true);
          setKonamiIndex(0);
        } else {
          setKonamiIndex(nextIndex);
        }
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex]);

  // Initial data and SSE live streaming setup
  useEffect(() => {
    fetchStatus().then(res => {
      if (res?.telemetry) {
        setTelemetry(res.telemetry);
        setActiveProxy(res.telemetry.activeProxy);
      }
    }).catch(console.error);

    fetchJobs().then(res => {
      if (res?.jobs) setJobs(res.jobs);
    }).catch(console.error);

    const eventSource = new EventSource('/api/telemetry/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'SNAPSHOT') {
          setTelemetry(data.payload);
          setActiveProxy(data.payload.activeProxy);
          if (data.logs) setLogs(data.logs);
        } else if (data.type === 'LOG') {
          setLogs(prev => [data.payload, ...prev].slice(0, 200));
        } else if (data.type === 'TELEMETRY') {
          setTelemetry(data.payload);
          setActiveProxy(data.payload.activeProxy);
          fetchJobs().then(res => {
            if (res?.jobs) setJobs(res.jobs);
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleStart = async (options) => {
    const result = await startScrape(options);
    if (result?.telemetry) {
      setTelemetry(result.telemetry);
      setActiveProxy(result.telemetry.activeProxy);
    }
    if (result?.jobs) setJobs(result.jobs);
  };

  const handleStop = async () => {
    await stopScrape();
  };

  const handleClearJobs = async () => {
    await clearJobs();
    setJobs([]);
  };

  const handleResetCircuitBreaker = async () => {
    await resetCircuitBreaker();
  };

  const handleRetryDlqAll = async () => {
    await retryDlq();
  };

  const handleRetryDlqItem = async (id) => {
    await retryDlq(id);
  };

  const isRunning = Boolean(telemetry?.isRunning);

  return (
    <div className="min-h-screen flex flex-col bg-[#04060a] text-slate-100 selection:bg-brand-500 selection:text-white cyber-grid relative">
      
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] ambient-glow-indigo pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[500px] h-[500px] ambient-glow-cyan pointer-events-none z-0" />

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRunning={isRunning}
        activeProxy={activeProxy}
        onOpenDocs={() => setShowDocs(true)}
        onTriggerEasterEgg={() => setShowEasterEgg(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 py-8 space-y-6 relative z-10">
        
        {/* Quick Performance Ribbon on all views */}
        <QuickMetricsBar
          stats={telemetry?.stats}
          circuitBreaker={telemetry?.circuitBreaker}
          totalJobs={jobs.length}
        />

        {/* TAB 1: LIVE CONTROL ROOM */}
        {activeTab === 'control' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Controls (5 Cols) */}
              <div className="lg:col-span-5">
                <ControlPanel
                  isRunning={isRunning}
                  onStart={handleStart}
                  onStop={handleStop}
                />
              </div>

              {/* Circuit Breaker & Schema Drift Cards (7 Cols) */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CircuitBreakerCard
                  metrics={telemetry?.circuitBreaker}
                  onReset={handleResetCircuitBreaker}
                />
                <SchemaDriftMatrix
                  driftHistory={telemetry?.driftHistory || []}
                />
              </div>

            </div>

            {/* Live SSE Telemetry Console */}
            <div>
              <TelemetryConsole
                logs={logs}
                stats={telemetry?.stats}
                onClear={() => setLogs([])}
              />
            </div>

            {/* Extracted Jobs Data Explorer Preview */}
            <div>
              <JobListingsTable
                jobs={jobs}
                onClear={handleClearJobs}
              />
            </div>
          </div>
        )}

        {/* TAB 2: EXTRACTED JOBS INTELLIGENCE */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <JobListingsTable
              jobs={jobs}
              onClear={handleClearJobs}
            />
          </div>
        )}

        {/* TAB 3: ANTI-BOT DEFENSE LAB */}
        {activeTab === 'defense' && (
          <div className="space-y-6">
            <DefenseLabView
              onStartExperiment={handleStart}
            />

            {/* Live Telemetry Console to watch experiment outcome */}
            <div>
              <TelemetryConsole
                logs={logs}
                stats={telemetry?.stats}
                onClear={() => setLogs([])}
              />
            </div>
          </div>
        )}

        {/* TAB 4: RESILIENCE MATRIX & DLQ */}
        {activeTab === 'resilience' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CircuitBreakerCard
                metrics={telemetry?.circuitBreaker}
                onReset={handleResetCircuitBreaker}
              />
              <SchemaDriftMatrix
                driftHistory={telemetry?.driftHistory || []}
              />
            </div>

            <DlqManager
              dlqMetrics={telemetry?.dlq}
              dlqItems={dlqItems}
              onRetryAll={handleRetryDlqAll}
              onRetryItem={handleRetryDlqItem}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.03] py-5 px-8 bg-gradient-to-b from-[#070b13]/80 to-[#04060a]/80 backdrop-blur-md text-center relative z-10">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-slate-500 font-sans">
            Acdyon Technologies Engineering Submission • Part 1: Resilient Scraper & Anti-Bot Evasion Engine
          </span>
          <span className="text-[11px] text-slate-600 font-sans">
            Tip: Press <code className="text-brand-400/70 font-mono bg-dark-800/60 px-2 py-0.5 rounded border border-white/[0.04]">Konami Code</code> or click Shield icon for Bonus Round
          </span>
        </div>
      </footer>

      {/* Architecture & Decisions Modal */}
      <ArchitectureModal
        isOpen={showDocs}
        onClose={() => setShowDocs(false)}
      />

      {/* Easter Egg Modal */}
      <EasterEggModal
        isOpen={showEasterEgg}
        onClose={() => setShowEasterEgg(false)}
      />

    </div>
  );
}
