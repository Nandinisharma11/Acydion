import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Production Dead Letter Queue (DLQ)
 * Captures failed ingestion jobs, quarantines unparseable or blocked payloads,
 * and schedules retries with exponential backoff and jitter.
 */

export class DeadLetterQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries || 3;
    this.baseBackoffMs = options.baseBackoffMs || 2000;
    this.queue = []; // Array of dead letter items
  }

  /**
   * Pushes a failed scrape job to the DLQ
   */
  push(target, errorReason, metadata = {}) {
    const existing = this.queue.find(item => item.target === target && item.status !== 'RESOLVED');

    if (existing) {
      existing.attempts += 1;
      existing.lastAttempt = Date.now();
      existing.errorReason = errorReason;
      existing.metadata = { ...existing.metadata, ...metadata };

      if (existing.attempts >= this.maxRetries) {
        existing.status = 'PERMANENTLY_FAILED';
        existing.nextRetryAt = null;
      } else {
        existing.status = 'PENDING_RETRY';
        // Exponential backoff: base * 2^(attempts-1) + jitter
        const backoff = this.baseBackoffMs * Math.pow(2, existing.attempts - 1);
        const jitter = Math.floor(Math.random() * 800);
        existing.nextRetryAt = Date.now() + backoff + jitter;
      }

      this.emit('updated', existing);
      return existing;
    }

    const item = {
      id: `dlq-${uuidv4().substring(0, 8)}`,
      target,
      errorReason,
      attempts: 1,
      maxRetries: this.maxRetries,
      createdAt: Date.now(),
      lastAttempt: Date.now(),
      status: 'PENDING_RETRY',
      metadata,
      nextRetryAt: Date.now() + this.baseBackoffMs + Math.floor(Math.random() * 500)
    };

    this.queue.unshift(item);
    this.emit('added', item);
    return item;
  }

  /**
   * Marks a dead letter item as resolved
   */
  resolve(id) {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = 'RESOLVED';
      item.resolvedAt = Date.now();
      this.emit('resolved', item);
    }
  }

  /**
   * Returns items due for retry
   */
  getDueRetries() {
    const now = Date.now();
    return this.queue.filter(item => item.status === 'PENDING_RETRY' && item.nextRetryAt <= now);
  }

  /**
   * Resets all items to retry immediately
   */
  requeueAll() {
    let count = 0;
    this.queue.forEach(item => {
      if (item.status !== 'RESOLVED') {
        item.status = 'PENDING_RETRY';
        item.attempts = 0;
        item.nextRetryAt = Date.now();
        count++;
      }
    });
    this.emit('requeued', count);
    return count;
  }

  getAll() {
    return this.queue;
  }

  getMetrics() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'PENDING_RETRY').length,
      permanentFailures: this.queue.filter(i => i.status === 'PERMANENTLY_FAILED').length,
      resolved: this.queue.filter(i => i.status === 'RESOLVED').length
    };
  }
}
