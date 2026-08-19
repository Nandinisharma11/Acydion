/**
 * Adaptive Pacing & Jitter Generator
 * Implements Box-Muller Gaussian transforms & Poisson process inter-arrival distributions
 * to eliminate robotic periodic request signatures.
 */

export class PacingEngine {
  /**
   * Generates a standard normal random variable using Box-Muller transform
   */
  static boxMullerRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Generates a Gaussian-distributed delay
   * @param {number} meanMs - Average delay in milliseconds
   * @param {number} stdDevMs - Standard deviation in milliseconds
   * @param {number} minMs - Minimum hard floor clamp
   */
  static getGaussianDelay(meanMs = 1500, stdDevMs = 350, minMs = 300) {
    const raw = meanMs + this.boxMullerRandom() * stdDevMs;
    // Micro-jitter of 5-35ms to eliminate floating point rounding signatures
    const microJitter = (Math.random() * 30) - 15;
    return Math.max(minMs, Math.round(raw + microJitter));
  }

  /**
   * Generates a Poisson-distributed delay (Exponential inter-arrival times)
   * lambda = 1 / meanMs
   */
  static getPoissonDelay(meanMs = 2500, minMs = 500) {
    const lambda = 1 / meanMs;
    const u = Math.random();
    const delay = -Math.log(1 - u) / lambda;
    return Math.max(minMs, Math.round(delay));
  }

  /**
   * Calculates delay based on selected profile
   */
  static calculateDelay(profileName = 'HUMAN_STEALTH', customSettings = {}) {
    switch (profileName) {
      case 'BURST':
        return Math.floor(Math.random() * 100) + 50;
      case 'NORMAL':
        return Math.floor(Math.random() * 600) + 600;
      case 'PARANOID':
        return this.getPoissonDelay(customSettings.meanMs || 3500, customSettings.minMs || 1000);
      case 'HUMAN_STEALTH':
      default:
        return this.getGaussianDelay(
          customSettings.meanMs || 1800,
          customSettings.stdDevMs || 400,
          customSettings.minMs || 400
        );
    }
  }

  /**
   * Asynchronously sleep for the calculated delay
   */
  static async sleep(delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
