import axios from 'axios';

/**
 * Realistic Browser Profile Matrix
 * Provides authentic combinations of User-Agent, Sec-CH-UA Client Hints, Accept headers, and Platform metadata.
 */
export const BROWSER_PROFILES = [
  {
    id: 'chrome-mac',
    browser: 'Chrome 122 (macOS)',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    clientHints: {
      'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-ch-ua-platform-version': '"14.3.1"',
      'sec-ch-ua-arch': '"arm"',
      'sec-ch-ua-bitness': '"64"',
      'sec-ch-ua-model': '""'
    },
    acceptHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  {
    id: 'chrome-win',
    browser: 'Chrome 122 (Windows 11)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    clientHints: {
      'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"15.0.0"',
      'sec-ch-ua-arch': '"x86"',
      'sec-ch-ua-bitness': '"64"',
      'sec-ch-ua-model': '""'
    },
    acceptHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  {
    id: 'safari-mac',
    browser: 'Safari 17.3 (macOS)',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
    clientHints: {}, // Safari does not send Sec-CH-UA headers
    acceptHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    }
  }
];

export class StealthHttpClient {
  constructor(sessionPool = null) {
    this.sessionCookies = new Map();
    this.currentProfileIndex = 0;
    this.sessionPool = sessionPool;
  }

  /**
   * Selects a profile (either random or round-robin)
   */
  getProfile(rotate = false) {
    if (rotate) {
      this.currentProfileIndex = (this.currentProfileIndex + 1) % BROWSER_PROFILES.length;
    }
    return BROWSER_PROFILES[this.currentProfileIndex];
  }

  /**
   * Builds high-fidelity HTTP headers that match legitimate browser behavior
   */
  buildHeaders(targetUrl, stealthEnabled = true, rotate = false, customReferer = null, attachAuthCookie = true) {
    if (!stealthEnabled) {
      // Standard raw Axios / Node default headers (easily detected by WAFs)
      return {
        'User-Agent': 'axios/1.7.9',
        'Accept': 'application/json, text/plain, */*'
      };
    }

    const profile = this.getProfile(rotate);
    const domain = new URL(targetUrl).hostname;

    const headers = {
      'User-Agent': profile.userAgent,
      ...profile.acceptHeaders,
      ...profile.clientHints,
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0'
    };

    if (customReferer) {
      headers['Referer'] = customReferer;
    } else {
      headers['Referer'] = `https://${domain}/`;
    }

    // Attach stored session cookies or pre-warmed auth cookies from session pool
    if (attachAuthCookie && this.sessionPool) {
      const authCookie = this.sessionPool.getAuthCookieForDomain(domain);
      if (authCookie) {
        headers['Cookie'] = authCookie;
      }
    }

    if (this.sessionCookies.has(domain)) {
      headers['Cookie'] = this.sessionCookies.get(domain);
    }

    return { headers, profile };
  }

  /**
   * Executes request with stealth options, telemetry, and response capture
   */
  async executeRequest(url, options = {}) {
    const {
      stealthEnabled = true,
      rotateProfile = false,
      attachAuthCookie = true,
      customReferer = null,
      timeout = 10000,
      validateStatus = () => true // Allow handling non-200 in circuit breaker
    } = options;

    const startTime = Date.now();
    const { headers, profile } = this.buildHeaders(url, stealthEnabled, rotateProfile, customReferer, attachAuthCookie);

    try {
      const response = await axios({
        url,
        method: 'GET',
        headers,
        timeout,
        validateStatus
      });

      const durationMs = Date.now() - startTime;
      const domain = new URL(url).hostname;

      // Extract and save Set-Cookie headers for session affinity
      if (response.headers['set-cookie']) {
        const cookies = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        this.sessionCookies.set(domain, cookies);
      }

      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        data: response.data,
        headers: response.headers,
        profileUsed: profile.browser,
        clientHintsSent: Object.keys(profile.clientHints || {}).length > 0,
        fingerprint: {
          userAgent: profile.userAgent,
          hasSecChUa: Boolean(headers['sec-ch-ua']),
          referer: headers['Referer'],
          cookieAttached: Boolean(headers['Cookie'])
        }
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      return {
        success: false,
        status: error.response?.status || 500,
        statusText: error.code || error.message,
        durationMs,
        error: error.message,
        profileUsed: profile.browser,
        clientHintsSent: Object.keys(profile.clientHints || {}).length > 0
      };
    }
  }
}
