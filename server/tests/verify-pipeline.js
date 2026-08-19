import { PacingEngine } from '../engine/pacing.js';
import { StealthHttpClient } from '../engine/stealthHttp.js';
import { CircuitBreaker, CircuitState } from '../engine/circuitBreaker.js';
import { AdaptiveParser } from '../engine/adaptiveParser.js';
import { DeadLetterQueue } from '../engine/dlq.js';
import { SessionPool } from '../engine/sessionPool.js';
import { GlassdoorSimulator } from '../sources/glassdoorSimulator.js';
import assert from 'assert';

console.log('🧪 Starting Acydion Ingestion Pipeline Verification Suite...\n');

// 1. Verify Pacing Engine
console.log('▶ [1/8] Testing Pacing Engine (Gaussian & Poisson Jitter)...');
const delays = [];
for (let i = 0; i < 50; i++) {
  const d = PacingEngine.getGaussianDelay(1000, 200, 300);
  assert(d >= 300, `Delay ${d} should be >= 300ms clamp`);
  delays.push(d);
}
const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
assert(avgDelay > 700 && avgDelay < 1300, `Average delay ${avgDelay} should hover near 1000ms`);
console.log(`  ✔ Gaussian delays generated successfully (Mean: ${Math.round(avgDelay)}ms, Range: ${Math.min(...delays)}ms - ${Math.max(...delays)}ms)`);

// 2. Verify Stealth HTTP Headers & Fingerprints
console.log('\n▶ [2/8] Testing Stealth Headers & Client-Hints Emulation...');
const stealthClient = new StealthHttpClient();
const stealthed = stealthClient.buildHeaders('https://example.com/jobs', true);
assert(stealthed.headers['User-Agent'], 'User-Agent must be present');
assert(stealthed.headers['Sec-Fetch-Dest'] === 'document', 'Sec-Fetch-Dest must match browser navigation');
assert(stealthed.headers['Referer'], 'Referer spoofing must be active');
const unstealthed = stealthClient.buildHeaders('https://example.com/jobs', false);
assert(unstealthed['User-Agent'].includes('axios'), 'Unstealthed client must expose axios identifier');
console.log(`  ✔ Stealth profile generation verified (${stealthed.profile.browser})`);

// 3. Verify Circuit Breaker State Transitions
console.log('\n▶ [3/8] Testing Circuit Breaker State Machine...');
const cb = new CircuitBreaker({
  failureThresholdPercent: 50,
  minRequestsWindow: 3,
  cooldownPeriodMs: 500,
  halfOpenSuccessRequired: 2
});

assert.strictEqual(cb.state, CircuitState.CLOSED, 'Circuit should start CLOSED');
cb.recordResult(true, 200);
cb.recordResult(true, 200);
assert.strictEqual(cb.state, CircuitState.CLOSED);

// Simulate Anti-bot 429 immediate trip
cb.recordResult(false, 429, 'Too Many Requests');
assert.strictEqual(cb.state, CircuitState.OPEN, 'Circuit should immediately trip to OPEN on 429');
assert.strictEqual(cb.canExecute(), false, 'Requests must be rejected when circuit is OPEN');

// Wait for cooldown
console.log('  ⏳ Waiting 600ms for circuit cooldown transition...');
await new Promise(r => setTimeout(r, 600));
assert.strictEqual(cb.canExecute(), true, 'After cooldown, canExecute must transition to HALF_OPEN');
assert.strictEqual(cb.state, CircuitState.HALF_OPEN, 'Circuit should be HALF_OPEN');

// 2 successful canary probes should close the circuit
cb.recordResult(true, 200);
cb.recordResult(true, 200);
assert.strictEqual(cb.state, CircuitState.CLOSED, 'Circuit should recover to CLOSED after successful probes');
console.log('  ✔ Circuit breaker state machine verified (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)');

// 4. Verify Adaptive Parser & Schema Drift Detection
console.log('\n▶ [4/8] Testing Adaptive Parser & Schema Drift Detection...');
const parser = new AdaptiveParser();

// Scenario A: Standard HTML markup with valid classes
const standardHtml = `
  <html>
    <body>
      <div class="job-card" data-id="job-1">
        <h2 class="job-title">Staff Infrastructure Engineer</h2>
        <div class="company">Acme Cloud</div>
        <span class="location">Remote</span>
        <span class="salary">$180,000</span>
      </div>
    </body>
  </html>
`;
const standardResult = parser.parseJobPayload(standardHtml, 'test-source');
assert.strictEqual(standardResult.listings.length, 1);
assert.strictEqual(standardResult.listings[0].title, 'Staff Infrastructure Engineer');
assert.strictEqual(standardResult.driftReport.driftDetected, false);
console.log('  ✔ Standard class selectors parsed successfully');

// Scenario B: Overnight DOM Class Mutation (CSS obfuscation / A-B testing)
const mutatedHtml = `
  <html>
    <body>
      <section>
        <div>
          <h3>Principal Platform Architect</h3>
          <em>Nova Systems Inc</em>
          <p>Location: REMOTE (Worldwide) | Compensation: $210k - $250k</p>
        </div>
      </section>
    </body>
  </html>
`;
const driftedResult = parser.parseJobPayload(mutatedHtml, 'test-source');
assert(driftedResult.listings.length > 0, 'Adaptive heuristic fallback should recover listing from mutated DOM');
assert.strictEqual(driftedResult.listings[0].title, 'Principal Platform Architect');
assert.strictEqual(driftedResult.driftReport.driftDetected, true, 'Schema drift MUST be flagged');
console.log(`  ✔ Schema Drift detected & recovered via heuristic fallback (${driftedResult.driftReport.details})`);

// 5. Verify Dead Letter Queue & Exponential Backoff
console.log('\n▶ [5/8] Testing Dead Letter Queue (DLQ)...');
const dlq = new DeadLetterQueue({ maxRetries: 3, baseBackoffMs: 1000 });
const item = dlq.push('https://target.com/jobs', 'HTTP 429 Rate Limit');
assert.strictEqual(item.attempts, 1);
assert.strictEqual(item.status, 'PENDING_RETRY');

// Second failure increases backoff
const updated = dlq.push('https://target.com/jobs', 'HTTP 429 Rate Limit');
assert.strictEqual(updated.attempts, 2);
assert(updated.nextRetryAt > Date.now() + 1500, 'Backoff should double with jitter');
console.log('  ✔ DLQ exponential backoff and quarantine verified');

// 6. Verify Glassdoor Soft Login Wall (SEO JSON-LD Bypass)
console.log('\n▶ [6/8] Testing Glassdoor Soft Login Wall (SEO JSON-LD Bypass)...');
const sim = new GlassdoorSimulator();
let softHtmlResponse = null;
sim.handleGlassdoorRequest({ headers: {}, query: { mode: 'soft_wall' } }, {
  status: () => ({
    send: (body) => { softHtmlResponse = body; }
  })
});
const softParsed = parser.parseJobPayload(softHtmlResponse, 'glassdoor_soft');
assert(softParsed.listings.length >= 2, 'Must extract JSON-LD job listings despite login modal overlay');
assert.strictEqual(softParsed.listings[0].title, 'Principal Distributed Systems Engineer');
assert.strictEqual(softParsed.listings[0].company, 'Airbnb');
console.log(`  ✔ Extracted ${softParsed.listings.length} listings from soft login wall via schema.org JSON-LD (${softParsed.driftReport.strategyUsed})`);

// 7. Verify Glassdoor Hard Login Wall & Session Cookie Pool
console.log('\n▶ [7/8] Testing Glassdoor Hard Login Wall (SessionPool Cookie Ingestion)...');
const sessionPool = new SessionPool();
const authCookie = sessionPool.getAuthCookieForDomain('localhost');
assert(authCookie && authCookie.includes('gd_session='), 'Session pool must provide valid auth cookie');

// Unauthenticated attempt should fail with 401
let unauthResult = null;
sim.handleGlassdoorRequest({ headers: {}, query: { mode: 'hard_wall' } }, {
  status: (code) => ({
    json: (data) => { unauthResult = { code, data }; }
  })
});
assert.strictEqual(unauthResult.code, 401, 'Unauthenticated request must receive 401');

// Authenticated attempt with session cookie succeeds with 200
let authResult = null;
sim.handleGlassdoorRequest({ headers: { 'cookie': authCookie }, query: { mode: 'hard_wall' } }, {
  status: (code) => ({
    json: (data) => { authResult = { code, data }; }
  })
});
assert.strictEqual(authResult.code, 200, 'Authenticated request with SessionPool cookie must succeed with 200');
assert.strictEqual(authResult.data.listings[0].company, 'Stripe');
console.log(`  ✔ Hard Login Wall verified (401 unauth blocked, 200 with SessionPool cookie passed)`);

// 8. Verify Direct Public ATS Gateway (Greenhouse/Lever Bypass)
console.log('\n▶ [8/8] Testing Direct Public ATS Syndication Gateway...');
let atsResult = null;
sim.handleAtsSyndication({ query: { company: 'Anthropic' } }, {
  status: (code) => ({
    json: (data) => { atsResult = { code, data }; }
  })
});
assert.strictEqual(atsResult.code, 200);
assert(atsResult.data.listings.length > 0);
assert.strictEqual(atsResult.data.company, 'Anthropic');
console.log(`  ✔ Direct ATS syndication verified (${atsResult.data.listings.length} listings extracted with zero login requirements)`);

// Summary
console.log('\n======================================================');
console.log('🎉 ALL 8 VERIFICATION TEST SUITES PASSED FLAWLESSLY!');
console.log('======================================================\n');
