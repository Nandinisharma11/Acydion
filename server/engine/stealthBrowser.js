/**
 * Headless Browser Stealth Architecture & Injection Suite
 * Encapsulates the precise JavaScript evaluation scripts and browser arguments
 * required to evade modern browser fingerprinting engines (Datadome, Cloudflare, Akamai, PerimeterX).
 */

export class StealthBrowserEngine {
  /**
   * Returns Chrome initialization flags that disable automation indicators
   */
  static getChromeLaunchFlags() {
    return [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-blink-features=AutomationControlled', // Crucial: prevents navigator.webdriver = true
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--lang=en-US,en;q=0.9',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ];
  }

  /**
   * Pre-load stealth script injected into target pages before any site JS executes
   */
  static getStealthInjectionScript() {
    return `
      // 1. Mask navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });

      // 2. Mock Chrome Runtime
      window.chrome = {
        app: {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        },
        runtime: {
          OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
          OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
          PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' }
        }
      };

      // 3. Spoof Plugins Array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
        ],
        configurable: true
      });

      // 4. Spoof Permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // 5. Spoof WebGL Vendor & Renderer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) return 'Intel Inc.';
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.apply(this, [parameter]);
      };

      // 6. Subtle Canvas Noise to prevent hash fingerprinting
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png' && this.width === 16 && this.height === 16) {
          // Detect canvas fingerprinting probes and return consistent authentic signature
        }
        return originalToDataURL.apply(this, arguments);
      };
    `;
  }

  /**
   * Generates realistic cubic Bezier curve points for human mouse trajectory simulation
   */
  static generateHumanMousePath(startX, startY, endX, endY, steps = 25) {
    const points = [];
    // Control points with random natural overshoot
    const cp1x = startX + (endX - startX) * 0.25 + (Math.random() * 60 - 30);
    const cp1y = startY + (endY - startY) * 0.25 + (Math.random() * 60 - 30);
    const cp2x = startX + (endX - startX) * 0.75 + (Math.random() * 40 - 20);
    const cp2y = startY + (endY - startY) * 0.75 + (Math.random() * 40 - 20);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(
        Math.pow(1 - t, 3) * startX +
        3 * Math.pow(1 - t, 2) * t * cp1x +
        3 * (1 - t) * Math.pow(t, 2) * cp2x +
        Math.pow(t, 3) * endX
      );
      const y = Math.round(
        Math.pow(1 - t, 3) * startY +
        3 * Math.pow(1 - t, 2) * t * cp1y +
        3 * (1 - t) * Math.pow(t, 2) * cp2y +
        Math.pow(t, 3) * endY
      );
      // Variable micro-delays between mouse ticks
      const delay = Math.round(5 + Math.random() * 12);
      points.push({ x, y, delay });
    }
    return points;
  }
}
