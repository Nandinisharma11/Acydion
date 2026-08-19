# Acydion

Acydion is a resilient job-ingestion pipeline with a React telemetry dashboard. It demonstrates adaptive parsing, pacing profiles, session rotation, circuit-breaker protection, dead-letter queue handling, WAF simulation, and real-time server-sent telemetry.

## Stack

- Node.js and Express API
- React and Vite dashboard
- Axios and Cheerio ingestion clients
- Server-sent events for live telemetry

## Requirements

- Node.js 18 or newer
- npm

## Setup

Install dependencies for the root, server, and client packages:

```bash
npm run install-all
```

## Run locally

Start the API and dashboard together:

```bash
npm run dev
```

The dashboard is available at `http://localhost:5173` and the API runs at `http://localhost:4000`.

To start either service separately:

```bash
npm run server
npm run client
```

Build the client for production:

```bash
npm run build
```

Run the pipeline verification test:

```bash
npm test
```

## API routes

- `GET /api/status` - health status and telemetry snapshot
- `POST /api/scrape/start` - start an ingestion run
- `POST /api/scrape/stop` - stop the active run
- `GET /api/jobs` - list extracted jobs
- `GET /api/dlq` - inspect dead-letter queue metrics and items
- `POST /api/dlq/retry` - retry one or all dead-letter items
- `POST /api/circuit-breaker/reset` - reset the circuit breaker
- `GET /api/sandbox/jobs` - simulated WAF-protected job source
- `GET /api/telemetry/stream` - live telemetry via SSE

## Project layout

```text
client/   React dashboard and UI components
server/   Express API, ingestion engine, sources, and tests
DECISIONS.md
DESIGN_DOC.md
```

## Notes

The included job sources and WAF endpoints are simulations or public-source adapters intended for local evaluation. Review target-site terms, robots policies, and applicable laws before using an ingestion client against an external service.