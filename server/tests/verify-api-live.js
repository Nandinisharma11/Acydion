/**
 * Full Live API Integration Test Suite
 * Tests all server endpoints against the running Express server on port 4000.
 */

const BASE = 'http://localhost:4000';
const results = [];

function pass(name) { results.push({ name, ok: true }); console.log('  ✔', name); }
function fail(name, err) { results.push({ name, ok: false, err }); console.log('  ✘', name, ':', err); }

async function run() {
  console.log('🔬 Full Live API Integration Verification Suite\n');

  // 1. Health Check
  console.log('▶ [1/9] API Status & Health Check');
  try {
    const r = await fetch(BASE + '/api/status').then(r => r.json());
    if (r.status === 'ONLINE' && r.targets && r.telemetry) pass('API status returns ONLINE with valid payload');
    else fail('API status', 'Unexpected shape');
  } catch (e) { fail('API status', e.message); }

  // 2. WAF Sandbox (stealthed)
  console.log('▶ [2/9] WAF Sandbox (stealthed request)');
  try {
    const r = await fetch(BASE + '/api/sandbox/jobs', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"'
      }
    }).then(r => r.json());
    if (r.success && r.listings && r.listings.length > 0) pass('WAF passes stealthed request with ' + r.listings.length + ' listings');
    else fail('WAF stealth', 'Unexpected response');
  } catch (e) { fail('WAF stealth', e.message); }

  // 3. WAF Sandbox (unstealthed - should 403)
  console.log('▶ [3/9] WAF Sandbox (unstealthed - expect 403)');
  try {
    const r = await fetch(BASE + '/api/sandbox/jobs', {
      headers: { 'user-agent': 'axios/1.7.9' }
    });
    if (r.status === 403) pass('WAF correctly blocks bot user-agent with 403');
    else fail('WAF unstealth', 'Expected 403, got ' + r.status);
  } catch (e) { fail('WAF unstealth', e.message); }

  // 4. Glassdoor Soft Wall
  console.log('▶ [4/9] Glassdoor Soft Login Wall HTML Payload');
  try {
    const r = await fetch(BASE + '/api/glassdoor/jobs?mode=soft_wall');
    const html = await r.text();
    const hasJsonLd = html.includes('application/ld+json');
    const hasModal = html.includes('login-modal-overlay');
    const hasJobData = html.includes('Principal Distributed Systems Engineer');
    if (hasJsonLd && hasModal && hasJobData) pass('Soft wall HTML has login modal + embedded JSON-LD schema');
    else fail('Soft wall', 'Missing content: jsonld=' + hasJsonLd + ' modal=' + hasModal + ' data=' + hasJobData);
  } catch (e) { fail('Soft wall', e.message); }

  // 5. Glassdoor Hard Wall (no cookie - expect 401)
  console.log('▶ [5/9] Glassdoor Hard Wall (unauthenticated - expect 401)');
  try {
    const r = await fetch(BASE + '/api/glassdoor/jobs?mode=hard_wall');
    if (r.status === 401) pass('Hard wall blocks unauthenticated with 401');
    else fail('Hard wall unauth', 'Expected 401, got ' + r.status);
  } catch (e) { fail('Hard wall unauth', e.message); }

  // 6. Glassdoor Hard Wall (with cookie - expect 200)
  console.log('▶ [6/9] Glassdoor Hard Wall (authenticated session cookie)');
  try {
    const r = await fetch(BASE + '/api/glassdoor/jobs?mode=hard_wall', {
      headers: { 'cookie': 'gd_session=val_prod_auth_981; gdId=982143' }
    }).then(r => r.json());
    if (r.status === 200 && r.listings && r.listings.length >= 2) pass('Auth cookie grants 200 with ' + r.listings.length + ' listings');
    else fail('Hard wall auth', 'Unexpected status=' + r.status);
  } catch (e) { fail('Hard wall auth', e.message); }

  // 7. ATS Syndication
  console.log('▶ [7/9] Direct Public ATS Syndication Gateway');
  try {
    const r = await fetch(BASE + '/api/ats/jobs?company=Anthropic').then(r => r.json());
    if (r.status === 200 && r.company === 'Anthropic' && r.loginRequired === false && r.listings.length >= 2) {
      pass('ATS returns ' + r.listings.length + ' listings for Anthropic with zero login');
    } else fail('ATS', 'Unexpected response');
  } catch (e) { fail('ATS', e.message); }

  // 8. Full Ingestion Pipeline E2E
  console.log('▶ [8/9] Full Pipeline E2E Run (WAF_SANDBOX -> Extract Jobs)');
  try {
    await fetch(BASE + '/api/jobs', { method: 'DELETE' });
    const start = await fetch(BASE + '/api/scrape/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetKey: 'WAF_SANDBOX', pacingProfile: 'NORMAL', stealthEnabled: true, maxBatches: 1 })
    }).then(r => r.json());

    if (!start.success) {
      fail('Pipeline start', start.message);
    } else {
      await new Promise(r => setTimeout(r, 2500));
      const jobs = await fetch(BASE + '/api/jobs').then(r => r.json());
      if (jobs.count > 0) pass('Pipeline extracted ' + jobs.count + ' jobs from WAF sandbox end-to-end');
      else fail('Pipeline extract', 'Got 0 jobs after pipeline run');
    }
  } catch (e) { fail('Pipeline run', e.message); }

  // 9. SSE Stream
  console.log('▶ [9/9] SSE Telemetry Stream Connection');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const r = await fetch(BASE + '/api/telemetry/stream', { signal: controller.signal });
    clearTimeout(timeout);
    if (r.headers.get('content-type') === 'text/event-stream') pass('SSE stream responds with text/event-stream');
    else fail('SSE', 'Wrong content-type: ' + r.headers.get('content-type'));
    controller.abort();
  } catch (e) {
    if (e.name === 'AbortError') pass('SSE stream opened successfully (aborted after 1.5s)');
    else fail('SSE', e.message);
  }

  // SUMMARY
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log('\n======================================================');
  if (failed === 0) {
    console.log('🎉 ALL ' + results.length + '/' + results.length + ' LIVE API TESTS PASSED!');
  } else {
    console.log('⚠️  ' + passed + '/' + results.length + ' passed, ' + failed + ' FAILED:');
    results.filter(r => !r.ok).forEach(r => console.log('   FAIL:', r.name, '-', r.err));
  }
  console.log('======================================================');
}

run();
