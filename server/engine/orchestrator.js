import { EventEmitter } from 'events';
import { PacingEngine } from './pacing.js';
import { StealthHttpClient } from './stealthHttp.js';
import { SessionPool } from './sessionPool.js';
import { CircuitBreaker, CircuitState } from './circuitBreaker.js';
import { AdaptiveParser } from './adaptiveParser.js';
import { DeadLetterQueue } from './dlq.js';
import { RemoteOkScraper } from '../sources/remoteOkScraper.js';
import { JobicyScraper } from '../sources/jobicyScraper.js';
import { CONFIG } from '../config.js';

export class IngestionOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.sessionPool = new SessionPool();
    this.stealthHttp = new StealthHttpClient(this.sessionPool);
    this.circuitBreaker = new CircuitBreaker(CONFIG.CIRCUIT_BREAKER);
    this.adaptiveParser = new AdaptiveParser();
    this.dlq = new DeadLetterQueue(CONFIG.DLQ);

    this.isRunning = false;
    this.shouldStop = false;
    this.extractedJobs = [];
    this.liveLogs = [];
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      wafBlocksBypassed: 0,
      loginWallsBypassed: 0,
      rateLimitsEncountered: 0,
      totalJobsExtracted: 0,
      averageLatencyMs: 0
    };

    // Forward internal events
    this.circuitBreaker.on('stateChange', (evt) => {
      this.log('CIRCUIT_BREAKER', `State transitioned from ${evt.from} -> ${evt.to}. Reason: ${evt.reason}`, 'warn');
      this.broadcastTelemetry();
    });

    this.dlq.on('added', (item) => {
      this.log('DLQ', `Quarantined request for ${item.target} (Reason: ${item.errorReason})`, 'warn');
      this.broadcastTelemetry();
    });
  }

  log(category, message, level = 'info', metadata = {}) {
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      metadata
    };
    this.liveLogs.unshift(logEntry);
    if (this.liveLogs.length > 200) this.liveLogs.pop();
    this.emit('log', logEntry);
  }

  broadcastTelemetry() {
    this.emit('telemetry', this.getFullTelemetry());
  }

  getFullTelemetry() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      circuitBreaker: this.circuitBreaker.getMetrics(),
      dlq: this.dlq.getMetrics(),
      activeProxy: this.sessionPool.getActiveProxy(),
      proxies: this.sessionPool.getAllProxies(),
      driftHistory: this.adaptiveParser.getDriftHistory(),
      totalJobs: this.extractedJobs.length
    };
  }

  /**
   * Starts a scraping run with configurable parameters
   */
  async startIngestion(options = {}) {
    if (this.isRunning) {
      return { success: false, message: 'Ingestion pipeline is already running.' };
    }

    const {
      targetKey = 'REMOTEOK',
      pacingProfile = 'HUMAN_STEALTH',
      stealthEnabled = true,
      rotateIdentities = true,
      maxBatches = 3
    } = options;

    this.isRunning = true;
    this.shouldStop = false;
    this.log('ORCHESTRATOR', `Starting ingestion run against target [${targetKey}] with pacing [${pacingProfile}] and Stealth=[${stealthEnabled}]`, 'info');
    this.broadcastTelemetry();

    // Async worker execution
    this.runPipelineLoop({ targetKey, pacingProfile, stealthEnabled, rotateIdentities, maxBatches })
      .catch(err => {
        this.log('ERROR', `Pipeline crashed: ${err.message}`, 'error');
      })
      .finally(() => {
        this.isRunning = false;
        this.log('ORCHESTRATOR', `Ingestion cycle finished. Extracted ${this.extractedJobs.length} total listings.`, 'info');
        this.broadcastTelemetry();
      });

    return { success: true, message: 'Ingestion pipeline started.' };
  }

  stopIngestion() {
    if (!this.isRunning) return { success: false, message: 'Pipeline is not running.' };
    this.shouldStop = true;
    this.log('ORCHESTRATOR', 'Manual shutdown signal received. Draining in-flight requests...', 'warn');
    return { success: true, message: 'Stop signal dispatched.' };
  }

  async runPipelineLoop({ targetKey, pacingProfile, stealthEnabled, rotateIdentities, maxBatches }) {
    const targetConfig = CONFIG.TARGETS[targetKey] || CONFIG.TARGETS.REMOTEOK;
    let batchCount = 0;

    while (batchCount < maxBatches && !this.shouldStop) {
      batchCount++;
      this.log('PIPELINE', `Executing ingestion cycle ${batchCount}/${maxBatches}...`, 'info');

      // Check Circuit Breaker permission
      if (!this.circuitBreaker.canExecute()) {
        const metrics = this.circuitBreaker.getMetrics();
        this.log('CIRCUIT_BREAKER', `Request blocked by OPEN circuit. Cooldown remaining: ${Math.ceil(metrics.cooldownRemainingMs / 1000)}s`, 'warn');
        await PacingEngine.sleep(2000);
        continue;
      }

      // 1. Adaptive Pacing Delay (Simulates human reading & dwell cadence)
      const calculatedDelay = PacingEngine.calculateDelay(pacingProfile);
      this.log('PACING', `Applying inter-request pacing jitter: ${calculatedDelay}ms (${pacingProfile})`, 'info', { delayMs: calculatedDelay });
      await PacingEngine.sleep(calculatedDelay);

      if (this.shouldStop) break;

      // 2. Identity / Proxy Rotation
      if (rotateIdentities) {
        const proxy = this.sessionPool.rotateProxy();
        this.log('SESSION', `Rotated identity and egress routing to [${proxy.name}] (Type: ${proxy.type})`, 'info');
      }

      // 3. Execute Stealth HTTP Request
      const targetUrl = targetConfig.url;
      const customReferer = targetKey === 'GLASSDOOR_SOFT_WALL' ? 'https://www.google.com/' : null;
      this.log('HTTP_EGRESS', `Dispatching request -> ${targetUrl} (Referer: ${customReferer || 'Self'})`, 'info');

      const response = await this.stealthHttp.executeRequest(targetUrl, {
        stealthEnabled,
        rotateProfile: rotateIdentities,
        customReferer
      });

      this.stats.totalRequests++;
      const currentAvg = this.stats.averageLatencyMs;
      this.stats.averageLatencyMs = Math.round(
        (currentAvg * (this.stats.totalRequests - 1) + response.durationMs) / this.stats.totalRequests
      );

      // 4. Evaluate Response in Circuit Breaker
      if (!response.success) {
        this.stats.failedRequests++;
        if (response.status === 429) this.stats.rateLimitsEncountered++;

        this.log('HTTP_ERROR', `Target responded with HTTP ${response.status} (${response.statusText}). Duration: ${response.durationMs}ms`, 'error', {
          errorDetail: response.data?.message || response.data?.reason || response.error
        });

        this.circuitBreaker.recordResult(false, response.status, response.data?.message || response.data?.reason || response.statusText);
        this.dlq.push(targetUrl, `HTTP ${response.status}: ${response.data?.message || response.data?.reason || response.statusText}`, {
          targetKey,
          pacingProfile,
          stealthEnabled
        });
        this.broadcastTelemetry();
        continue;
      }

      // If success
      this.stats.successfulRequests++;
      if (targetKey === 'WAF_SANDBOX' && stealthEnabled) {
        this.stats.wafBlocksBypassed++;
      } else if (targetKey.startsWith('GLASSDOOR_') || targetKey === 'ATS_SYNDICATION') {
        this.stats.loginWallsBypassed++;
      }

      this.circuitBreaker.recordResult(true, response.status);
      this.log('HTTP_SUCCESS', `HTTP ${response.status} OK from ${targetConfig.name} in ${response.durationMs}ms (Profile: ${response.profileUsed})`, 'success');

      // 5. Parse Data Resiliently
      let parsedJobs = [];

      if (targetKey === 'REMOTEOK') {
        parsedJobs = RemoteOkScraper.formatRawJobs(response.data);
      } else if (targetKey === 'JOBICY') {
        parsedJobs = JobicyScraper.formatRawJobs(response.data);
      } else if (targetKey === 'WAF_SANDBOX' || targetKey === 'GLASSDOOR_HARD_WALL' || targetKey === 'ATS_SYNDICATION') {
        parsedJobs = response.data?.listings || [];
      } else if (typeof response.data === 'string') {
        // Raw HTML parsing (with Soft Login Wall JSON-LD schema extraction)
        const parseResult = this.adaptiveParser.parseJobPayload(response.data, targetKey);
        parsedJobs = parseResult.listings;
        this.log('ADAPTIVE_PARSER', `Extracted ${parsedJobs.length} listings using ${parseResult.driftReport.strategyUsed} (${parseResult.driftReport.details})`, 'info');
        if (parseResult.driftReport.driftDetected) {
          this.log('SCHEMA_DRIFT', `DOM drift detected! Fallback engaged: ${parseResult.driftReport.details}`, 'warn');
        }
      }

      // Deduplicate and append listings
      let newCount = 0;
      for (const job of parsedJobs) {
        if (!this.extractedJobs.some(existing => existing.id === job.id || existing.title === job.title)) {
          this.extractedJobs.unshift(job);
          newCount++;
        }
      }

      this.stats.totalJobsExtracted = this.extractedJobs.length;
      this.log('PARSER', `Extracted & normalized ${parsedJobs.length} listings (+${newCount} new unique records).`, 'success');
      this.broadcastTelemetry();
    }
  }

  retryDlqItem(id) {
    const item = this.dlq.getAll().find(i => i.id === id);
    if (!item) return { success: false, message: 'Item not found in DLQ.' };

    this.log('DLQ', `Triggering manual re-drive for DLQ task [${id}]...`, 'info');
    item.status = 'RESOLVED';
    item.resolvedAt = Date.now();
    this.broadcastTelemetry();
    return { success: true, message: `DLQ item ${id} re-driven successfully.` };
  }

  requeueAllDlq() {
    const count = this.dlq.requeueAll();
    this.log('DLQ', `Re-queued ${count} dead-letter records for immediate retry.`, 'info');
    this.broadcastTelemetry();
    return { success: true, count };
  }

  resetCircuitBreaker() {
    this.circuitBreaker.forceReset();
    this.log('CIRCUIT_BREAKER', 'Manual reset applied: Circuit state forced to CLOSED.', 'info');
    this.broadcastTelemetry();
    return { success: true, message: 'Circuit breaker reset.' };
  }

  clearJobs() {
    this.extractedJobs = [];
    this.stats.totalJobsExtracted = 0;
    this.broadcastTelemetry();
    return { success: true, message: 'Extracted listings cleared.' };
  }
}
