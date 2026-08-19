import express from 'express';
import { WafSandbox } from '../sources/wafSandbox.js';
import { GlassdoorSimulator } from '../sources/glassdoorSimulator.js';
import { CONFIG } from '../config.js';

export function createApiRouter(orchestrator) {
  const router = express.Router();
  const wafSandbox = new WafSandbox();
  const glassdoorSim = new GlassdoorSimulator();

  // 1. Health & Initial Telemetry
  router.get('/status', (req, res) => {
    res.json({
      status: 'ONLINE',
      system: 'Acydion Resilient Ingestion Pipeline v1.0',
      telemetry: orchestrator.getFullTelemetry(),
      targets: CONFIG.TARGETS,
      pacingProfiles: CONFIG.PACING_PROFILES
    });
  });

  // 2. Trigger Ingestion Run
  router.post('/scrape/start', async (req, res) => {
    const { targetKey, pacingProfile, stealthEnabled, rotateIdentities, maxBatches } = req.body;
    const result = await orchestrator.startIngestion({
      targetKey,
      pacingProfile,
      stealthEnabled: stealthEnabled !== false,
      rotateIdentities: rotateIdentities !== false,
      maxBatches: parseInt(maxBatches) || 3
    });
    res.json(result);
  });

  // 3. Stop Ingestion Run
  router.post('/scrape/stop', (req, res) => {
    const result = orchestrator.stopIngestion();
    res.json(result);
  });

  // 4. Get Extracted Jobs
  router.get('/jobs', (req, res) => {
    res.json({
      count: orchestrator.extractedJobs.length,
      jobs: orchestrator.extractedJobs
    });
  });

  // 5. Clear Extracted Jobs
  router.delete('/jobs', (req, res) => {
    const result = orchestrator.clearJobs();
    res.json(result);
  });

  // 6. DLQ Endpoints
  router.get('/dlq', (req, res) => {
    res.json({
      metrics: orchestrator.dlq.getMetrics(),
      items: orchestrator.dlq.getAll()
    });
  });

  router.post('/dlq/retry', (req, res) => {
    const { id } = req.body;
    if (id) {
      const result = orchestrator.retryDlqItem(id);
      return res.json(result);
    } else {
      const result = orchestrator.requeueAllDlq();
      return res.json(result);
    }
  });

  // 7. Reset Circuit Breaker
  router.post('/circuit-breaker/reset', (req, res) => {
    const result = orchestrator.resetCircuitBreaker();
    res.json(result);
  });

  // 8. Simulated Adversarial WAF Endpoint
  router.get('/sandbox/jobs', (req, res) => {
    return wafSandbox.handleRequest(req, res);
  });

  // 9. Glassdoor Soft & Hard Login Wall Simulator Endpoint
  router.get('/glassdoor/jobs', (req, res) => {
    return glassdoorSim.handleGlassdoorRequest(req, res);
  });

  // 10. Direct Public ATS Syndication (Greenhouse / Lever) Endpoint
  router.get('/ats/jobs', (req, res) => {
    return glassdoorSim.handleAtsSyndication(req, res);
  });

  // 11. Real-time Telemetry Stream via SSE
  router.get('/telemetry/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'SNAPSHOT', payload: orchestrator.getFullTelemetry(), logs: orchestrator.liveLogs })}\n\n`);

    const logListener = (logEntry) => {
      res.write(`data: ${JSON.stringify({ type: 'LOG', payload: logEntry })}\n\n`);
    };

    const telemetryListener = (telemetryData) => {
      res.write(`data: ${JSON.stringify({ type: 'TELEMETRY', payload: telemetryData })}\n\n`);
    };

    orchestrator.on('log', logListener);
    orchestrator.on('telemetry', telemetryListener);

    // Heartbeat ping every 15s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      orchestrator.removeListener('log', logListener);
      orchestrator.removeListener('telemetry', telemetryListener);
    });
  });

  return router;
}
