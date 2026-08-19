export const CONFIG = {
  PORT: process.env.PORT || 4000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  TARGETS: {
    REMOTEOK: {
      id: 'remoteok',
      name: 'RemoteOK (Live Real Public Source)',
      url: 'https://remoteok.com/api',
      htmlUrl: 'https://remoteok.com/remote-engineer-jobs',
      type: 'live_real'
    },
    JOBICY: {
      id: 'jobicy',
      name: 'Jobicy (Live Real Remote Board)',
      url: 'https://jobicy.com/api/v2/remote-jobs?count=20',
      type: 'live_real'
    },
    GLASSDOOR_SOFT_WALL: {
      id: 'glassdoor_soft_wall',
      name: 'Glassdoor (Soft Login Wall / SEO JSON-LD Bypass)',
      url: 'http://localhost:4000/api/glassdoor/jobs?mode=soft_wall',
      type: 'login_gated_soft'
    },
    GLASSDOOR_HARD_WALL: {
      id: 'glassdoor_hard_wall',
      name: 'Glassdoor (Hard Login Wall / Session Cookie Pool)',
      url: 'http://localhost:4000/api/glassdoor/jobs?mode=hard_wall',
      type: 'login_gated_hard'
    },
    ATS_SYNDICATION: {
      id: 'ats_syndication',
      name: 'Direct Public ATS Gateway (Greenhouse/Lever Bypass)',
      url: 'http://localhost:4000/api/ats/jobs?company=OpenAI',
      type: 'ats_syndication'
    },
    WAF_SANDBOX: {
      id: 'waf_sandbox',
      name: 'Adversarial Anti-Bot WAF Sandbox (Tests 429/403/Stealth)',
      url: 'http://localhost:4000/api/sandbox/jobs',
      type: 'adversarial_sandbox'
    }
  },
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD_PERCENT: 50,
    MIN_REQUESTS_WINDOW: 4,
    COOLDOWN_PERIOD_MS: 7000,
    HALF_OPEN_SUCCESS_REQUIRED: 2
  },
  PACING_PROFILES: {
    BURST: { name: 'Aggressive Burst (Bot Risk: HIGH)', minMs: 50, maxMs: 150, jitter: 'none' },
    NORMAL: { name: 'Moderate Interval', minMs: 600, maxMs: 1200, jitter: 'uniform' },
    HUMAN_STEALTH: { name: 'Human Gaussian Pacing (Recommended)', meanMs: 1800, stdDevMs: 400, jitter: 'gaussian' },
    PARANOID: { name: 'Ultra-Low Frequency Tor/Residential', meanMs: 3500, stdDevMs: 900, jitter: 'poisson' }
  },
  DLQ: {
    MAX_RETRIES: 3,
    BASE_BACKOFF_MS: 2000
  }
};
