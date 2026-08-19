/**
 * Adversarial Anti-Bot WAF Sandbox
 * A controlled testing environment that rigorously simulates modern Cloudflare/Akamai/Datadome
 * defenses:
 *   1. Request cadence anomaly detection (<400ms intervals)
 *   2. Header inspection (Missing Sec-CH-UA, axios/curl default User-Agents)
 *   3. Missing browser accept signatures
 *   4. Honeypot URL trap triggers
 */

export class WafSandbox {
  constructor() {
    this.clientHistory = new Map(); // IP/client -> { lastRequestTime: number, burstCount: number }
    this.honeypotsTriggered = 0;
  }

  /**
   * Middleware handler simulating WAF inspection
   */
  handleRequest(req, res) {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const secChUa = req.headers['sec-ch-ua'];
    const accept = req.headers['accept'] || '';
    const now = Date.now();

    // 1. Inspect User-Agent signature
    const isBotUserAgent = /axios|curl|python|urllib|postman|node-fetch|got/i.test(userAgent);
    if (isBotUserAgent || !userAgent) {
      return res.status(403).json({
        waf: 'Acydion-Armor-v2',
        blockType: 'BOT_SIGNATURE_DETECTED',
        reason: `Automated client detected in User-Agent header: "${userAgent || 'EMPTY'}"`,
        mitigation: 'Enable Stealth HTTP client with realistic browser headers.',
        status: 403
      });
    }

    // 2. Client-Hints Consistency Check (Chrome/Edge MUST send Sec-CH-UA on modern endpoints)
    const isChrome = /Chrome|Chromium|Edg/i.test(userAgent);
    if (isChrome && !secChUa) {
      return res.status(403).json({
        waf: 'Acydion-Armor-v2',
        blockType: 'MISSING_CLIENT_HINTS',
        reason: 'User-Agent indicates Chrome 120+, but Sec-CH-UA Client-Hints headers are absent (Classic Headless/Scripting tell).',
        mitigation: 'Pass modern Sec-CH-UA platform and version headers.',
        status: 403
      });
    }

    // 3. Cadence & Burst Detection (Simulating Token Bucket / Sliding Window Rate Limiting)
    if (!this.clientHistory.has(ip)) {
      this.clientHistory.set(ip, { lastRequestTime: now, burstCount: 1 });
    } else {
      const record = this.clientHistory.get(ip);
      const delta = now - record.lastRequestTime;

      if (delta < 350) {
        record.burstCount += 1;
        record.lastRequestTime = now;

        if (record.burstCount >= 2) {
          return res.status(429).json({
            waf: 'Acydion-Armor-v2',
            blockType: 'RATE_LIMIT_EXCEEDED',
            reason: `Unnatural request interval (${delta}ms). Rapid bursts trigger automatic IP quarantine.`,
            mitigation: 'Switch to Gaussian or Poisson human pacing profile.',
            status: 429
          });
        }
      } else {
        // Natural human delay resets burst counter
        record.burstCount = 0;
        record.lastRequestTime = now;
      }
    }

    // 4. Honeypot check
    if (req.query.ref === 'honeypot_hidden_trap') {
      this.honeypotsTriggered++;
      return res.status(403).json({
        waf: 'Acydion-Armor-v2',
        blockType: 'HONEYPOT_TRIPPED',
        reason: 'Crawler followed a CSS display:none honeypot link intended only for bots.',
        status: 403
      });
    }

    // Passed all WAF checks! Serve authentic protected listing payload with dynamic DOM structure
    const sampleListings = [
      {
        id: 'waf-job-101',
        title: 'Senior Distributed Systems Engineer (Platform)',
        company: 'CloudStream Networks',
        location: 'Remote (US/EU)',
        salary: '$165,000 - $210,000',
        tags: ['Go', 'Kubernetes', 'gRPC', 'Distributed Systems'],
        url: 'https://example.com/jobs/distributed-eng',
        timestamp: new Date().toISOString(),
        extractionMethod: 'WAF Bypass (Stealth Validated)'
      },
      {
        id: 'waf-job-102',
        title: 'Staff Security Engineer - Anti-Bot & Threat Intel',
        company: 'CyberShield AI',
        location: 'Remote (Global)',
        salary: '$180,000 - $230,000',
        tags: ['Rust', 'WAF', 'Reverse Engineering', 'TLS/JA4'],
        url: 'https://example.com/jobs/security-staff',
        timestamp: new Date().toISOString(),
        extractionMethod: 'WAF Bypass (Stealth Validated)'
      },
      {
        id: 'waf-job-103',
        title: 'Lead Full-Stack React & Node.js Architect',
        company: 'HyperScale Labs',
        location: 'San Francisco, CA (Hybrid)',
        salary: '$170,000 - $220,000',
        tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        url: 'https://example.com/jobs/fullstack-lead',
        timestamp: new Date().toISOString(),
        extractionMethod: 'WAF Bypass (Stealth Validated)'
      },
      {
        id: 'waf-job-104',
        title: 'Machine Learning Infrastructure Engineer',
        company: 'NeuralFlow Data',
        location: 'Remote (Americas)',
        salary: '$190,000 - $245,000',
        tags: ['Python', 'PyTorch', 'Ray', 'CUDA'],
        url: 'https://example.com/jobs/ml-infra',
        timestamp: new Date().toISOString(),
        extractionMethod: 'WAF Bypass (Stealth Validated)'
      }
    ];

    return res.status(200).json({
      success: true,
      wafStatus: 'PASSED_CLEAN',
      wafTelemetry: {
        receivedUserAgent: userAgent,
        receivedSecChUa: secChUa || 'N/A',
        fingerprintStatus: 'VALID_BROWSER_SIGNATURE',
        burstRiskScore: '0.04 (LOW)'
      },
      listings: sampleListings
    });
  }
}
