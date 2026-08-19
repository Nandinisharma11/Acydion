const API_BASE = '/api';

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}

export async function startScrape(options) {
  const res = await fetch(`${API_BASE}/scrape/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  return res.json();
}

export async function stopScrape() {
  const res = await fetch(`${API_BASE}/scrape/stop`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchJobs() {
  const res = await fetch(`${API_BASE}/jobs`);
  return res.json();
}

export async function clearJobs() {
  const res = await fetch(`${API_BASE}/jobs`, { method: 'DELETE' });
  return res.json();
}

export async function resetCircuitBreaker() {
  const res = await fetch(`${API_BASE}/circuit-breaker/reset`, { method: 'POST' });
  return res.json();
}

export async function retryDlq(id = null) {
  const res = await fetch(`${API_BASE}/dlq/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return res.json();
}
