import { EventEmitter } from 'events';

/**
 * 3-State Resilient Circuit Breaker
 * States:
 *   - CLOSED: Normal operation. Requests flow freely. Tracks failure rate.
 *   - OPEN: Tripped due to rate limits (429), CAPTCHAs, or WAF blocks (403). Fails fast or falls back to avoid IP burns.
 *   - HALF_OPEN: Probe state after cooldown. Allows limited trial requests to test if target cooled down.
 */

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

export class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.failureThresholdPercent = options.failureThresholdPercent || 40;
    this.minRequestsWindow = options.minRequestsWindow || 5;
    this.cooldownPeriodMs = options.cooldownPeriodMs || 7000;
    this.halfOpenSuccessRequired = options.halfOpenSuccessRequired || 2;

    this.state = CircuitState.CLOSED;
    this.history = []; // rolling window of { success: boolean, status: number, timestamp: number }
    this.windowSize = 10;
    
    this.openedAt = null;
    this.halfOpenSuccessCount = 0;
    this.totalTrippedCount = 0;
    this.lastFailureReason = null;
  }

  /**
   * Evaluates if a request is permitted to proceed
   */
  canExecute() {
    const now = Date.now();

    if (this.state === CircuitState.OPEN) {
      if (now - this.openedAt >= this.cooldownPeriodMs) {
        this.transitionTo(CircuitState.HALF_OPEN, 'Cooldown period elapsed; initiating probe canary');
        return true;
      }
      return false;
    }

    return true; // CLOSED or HALF_OPEN
  }

  /**
   * Records execution outcome
   */
  recordResult(success, status = 200, errorReason = null) {
    const now = Date.now();
    this.history.push({ success, status, timestamp: now });

    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    if (!success) {
      this.lastFailureReason = errorReason || `HTTP ${status}`;
    }

    if (this.state === CircuitState.CLOSED) {
      this.evaluateClosedState(status, errorReason);
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.evaluateHalfOpenState(success, status, errorReason);
    }

    this.emitTelemetry();
  }

  evaluateClosedState(status, errorReason) {
    // Immediate trip on explicit anti-bot blocks (429 Too Many Requests or 403 Cloudflare/Akamai challenge)
    if (status === 429 || status === 403) {
      this.transitionTo(CircuitState.OPEN, `Immediate Trip: Anti-Bot Signature Detected (${status} - ${errorReason || 'Rate Limited / Blocked'})`);
      return;
    }

    if (this.history.length >= this.minRequestsWindow) {
      const failures = this.history.filter(h => !h.success).length;
      const failureRate = (failures / this.history.length) * 100;

      if (failureRate >= this.failureThresholdPercent) {
        this.transitionTo(CircuitState.OPEN, `Sliding window failure rate (${failureRate.toFixed(1)}%) exceeded threshold (${this.failureThresholdPercent}%)`);
      }
    }
  }

  evaluateHalfOpenState(success, status, errorReason) {
    if (success) {
      this.halfOpenSuccessCount++;
      if (this.halfOpenSuccessCount >= this.halfOpenSuccessRequired) {
        this.transitionTo(CircuitState.CLOSED, `Canary probe succeeded ${this.halfOpenSuccessCount}/${this.halfOpenSuccessRequired} times. Target healthy.`);
      }
    } else {
      this.transitionTo(CircuitState.OPEN, `Canary probe failed (${status} - ${errorReason || 'Refused'}). Resetting cooldown.`);
    }
  }

  transitionTo(newState, reason) {
    const previousState = this.state;
    this.state = newState;

    if (newState === CircuitState.OPEN) {
      this.openedAt = Date.now();
      this.totalTrippedCount++;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenSuccessCount = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.openedAt = null;
      this.halfOpenSuccessCount = 0;
    }

    this.emit('stateChange', {
      from: previousState,
      to: newState,
      reason,
      timestamp: Date.now()
    });
  }

  forceReset() {
    this.history = [];
    this.state = CircuitState.CLOSED;
    this.openedAt = null;
    this.halfOpenSuccessCount = 0;
    this.lastFailureReason = null;
    this.emitTelemetry();
  }

  getMetrics() {
    const totalInWindow = this.history.length;
    const failures = this.history.filter(h => !h.success).length;
    const failureRate = totalInWindow === 0 ? 0 : Math.round((failures / totalInWindow) * 100);
    const cooldownRemainingMs = this.state === CircuitState.OPEN && this.openedAt
      ? Math.max(0, this.cooldownPeriodMs - (Date.now() - this.openedAt))
      : 0;

    return {
      state: this.state,
      failureRatePercent: failureRate,
      failuresInWindow: failures,
      windowSize: totalInWindow,
      totalTrippedCount: this.totalTrippedCount,
      lastFailureReason: this.lastFailureReason,
      cooldownRemainingMs,
      cooldownPeriodMs: this.cooldownPeriodMs,
      halfOpenSuccessCount: this.halfOpenSuccessCount,
      halfOpenSuccessRequired: this.halfOpenSuccessRequired
    };
  }

  emitTelemetry() {
    this.emit('metrics', this.getMetrics());
  }
}
