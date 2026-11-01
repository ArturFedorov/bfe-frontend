import { createHash } from 'crypto';
import { Worker } from 'worker_threads';

// Available building blocks — see README:
// - createHash('sha256').update(input).digest('hex')
// - new Worker(code, { eval: true, workerData }) with plain-JS `code`
void createHash;
void Worker;

/**
 * Reference implementation — runs ON THE CALLING THREAD (blocking).
 * SHA-256 hex digest of the payload, iterated: round N hashes the hex
 * digest of round N-1. Throws RangeError for rounds < 1 or non-integer.
 */
export function checksum(payload: string, rounds = 1): string {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Computes the same iterated checksum on a worker_threads worker (inline via
 * eval: true), keeping the main event loop free. Settles exactly once across
 * message/error/exit; rejects invalid rounds without spawning a worker; never
 * leaves a dangling worker behind.
 */
export function checksumInWorker(payload: string, rounds = 1): Promise<string> {
  // TODO: implement
  throw new Error('Not implemented');
}
