export type Phase = 'sync' | 'nextTick' | 'promise' | 'setImmediate' | 'setTimeout';

export type MicrotaskLabel = 'tickA' | 'tickB' | 'promiseA' | 'promiseB';

/**
 * Schedules one callback of each kind (from inside a timer callback, so the
 * setImmediate-vs-setTimeout order is deterministic) and resolves with the
 * order in which they actually fired.
 */
export function observeEventLoopOrder(): Promise<Phase[]> {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Demonstrates microtask queue draining rules:
 * - the nextTick queue drains COMPLETELY (including callbacks it enqueues)
 *   before the promise microtask queue runs;
 * - within each queue, FIFO order holds.
 *
 * Must schedule from a clean macrotask — see the README.
 */
export function observeMicrotaskInterleaving(): Promise<MicrotaskLabel[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
