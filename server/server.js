import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { IngestionOrchestrator } from './engine/orchestrator.js';
import { createApiRouter } from './routes/api.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const orchestrator = new IngestionOrchestrator();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Mount API routes
app.use('/api', createApiRouter(orchestrator));

// Serve client build if available
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Acydion Resilient Ingestion Server</title></head>
          <body style="font-family: sans-serif; background: #0b0f19; color: #f3f4f6; padding: 40px;">
            <h2>⚡ Acydion Resilient Ingestion API is Running</h2>
            <p>API is available at <code>/api/status</code></p>
            <p>To view the React UI, run <code>npm run dev</code> or <code>npm run client</code> (port 5173).</p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = CONFIG.PORT;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Acydion Ingestion Engine Server running on port ${PORT}`);
  console.log(`📡 API & SSE Endpoint: http://localhost:${PORT}/api/telemetry/stream`);
  console.log(`🛡️ WAF Sandbox: http://localhost:${PORT}/api/sandbox/jobs`);
  console.log(`======================================================\n`);
});

export { app, orchestrator };
