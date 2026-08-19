/**
 * Session & Identity Pool Manager
 * Manages authenticated/unauthenticated cookie states, warm-up handshakes,
 * and proxy endpoint rotation.
 */

export class SessionPool {
  constructor() {
    this.sessions = new Map();
    this.proxies = [
      { id: 'direct-node', name: 'Direct Egress (Local Host)', type: 'direct', latency: '12ms', health: 100 },
      { id: 'res-us-east-1', name: 'Residential US-East (Virginia)', type: 'residential', latency: '84ms', health: 98 },
      { id: 'res-eu-central-1', name: 'Residential EU-West (Frankfurt)', type: 'residential', latency: '120ms', health: 95 },
      { id: 'dc-asia-south-1', name: 'Datacenter AP-South (Mumbai)', type: 'datacenter', latency: '45ms', health: 99 }
    ];
    this.activeProxyIndex = 0;

    // Pre-warmed authenticated session cookie pool (for Glassdoor, LinkedIn, ATS)
    this.authenticatedCookiePool = {
      'localhost': 'gd_session=val_prod_auth_981; li_at=AQEDATk5_authenticated; cf_clearance=0a8f9c1b',
      'glassdoor.com': 'gd_session=val_prod_auth_981; gdId=982143; ASL=1.0',
      'linkedin.com': 'li_at=AQEDATk5_authenticated; JSESSIONID="ajax:8923412"'
    };
  }

  getActiveProxy() {
    return this.proxies[this.activeProxyIndex];
  }

  rotateProxy() {
    this.activeProxyIndex = (this.activeProxyIndex + 1) % this.proxies.length;
    return this.getActiveProxy();
  }

  setProxy(proxyId) {
    const idx = this.proxies.findIndex(p => p.id === proxyId);
    if (idx !== -1) {
      this.activeProxyIndex = idx;
      return this.proxies[idx];
    }
    return this.getActiveProxy();
  }

  getAllProxies() {
    return this.proxies.map((p, idx) => ({
      ...p,
      isActive: idx === this.activeProxyIndex
    }));
  }

  getAuthCookieForDomain(domain) {
    return this.authenticatedCookiePool[domain] || null;
  }

  getSession(domain) {
    if (!this.sessions.has(domain)) {
      this.sessions.set(domain, {
        domain,
        cookies: {},
        requestCount: 0,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isWarmedUp: false
      });
    }
    const session = this.sessions.get(domain);
    session.requestCount++;
    session.lastUsed = Date.now();
    return session;
  }

  clearSession(domain) {
    this.sessions.delete(domain);
  }
}
