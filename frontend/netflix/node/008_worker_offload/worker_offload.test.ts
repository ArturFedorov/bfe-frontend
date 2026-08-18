import { createHash } from 'crypto';
import { checksum, checksumInWorker } from './worker_offload';

const sha256 = (input: string) =>
  createHash('sha256').update(input).digest('hex');

/**
 * Pick a round count that keeps the worker busy for roughly 250ms on THIS
 * machine, so the responsiveness assertions are meaningful without being
 * slow or flaky on fast/slow hardware.
 */
function calibrateRounds(): number {
  const probe = 20_000;
  const start = process.hrtime.bigint();
  checksum('calibration-probe', probe);
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  const perRoundMs = Math.max(elapsedMs / probe, 0.0002);
  return Math.min(Math.ceil(250 / perRoundMs), 5_000_000);
}

describe('checksum (blocking reference)', () => {
  it('computes a single-round sha256 hex digest', () => {
    expect(checksum('delivery-archive-bytes')).toBe(
      sha256('delivery-archive-bytes'),
    );
  });

  it('iterates: round N hashes the hex digest of round N-1', () => {
    const expected = sha256(sha256(sha256('payload')));
    expect(checksum('payload', 3)).toBe(expected);
  });

  it('throws RangeError for invalid rounds', () => {
    expect(() => checksum('x', 0)).toThrow(RangeError);
    expect(() => checksum('x', 1.5)).toThrow(RangeError);
    expect(() => checksum('x', -3)).toThrow(RangeError);
  });
});

describe('checksumInWorker', () => {
  it('matches the reference implementation (single round, default)', async () => {
    await expect(checksumInWorker('partner-archive')).resolves.toBe(
      checksum('partner-archive'),
    );
  });

  it('matches the reference implementation for iterated rounds', async () => {
    await expect(checksumInWorker('partner-archive', 1_000)).resolves.toBe(
      checksum('partner-archive', 1_000),
    );
  });

  it('handles concurrent calls independently', async () => {
    const [a, b, c] = await Promise.all([
      checksumInWorker('alpha', 10),
      checksumInWorker('beta', 20),
      checksumInWorker('gamma', 30),
    ]);
    expect(a).toBe(checksum('alpha', 10));
    expect(b).toBe(checksum('beta', 20));
    expect(c).toBe(checksum('gamma', 30));
  });

  it('rejects invalid rounds without spawning a worker', async () => {
    await expect(checksumInWorker('x', 0)).rejects.toBeInstanceOf(RangeError);
    await expect(checksumInWorker('x', 2.5)).rejects.toBeInstanceOf(RangeError);
  });

  it('rejects when the worker throws', async () => {
    // A non-string payload makes createHash().update() throw inside the
    // worker. Note: the error is re-serialized across the thread boundary,
    // so assert on shape, not on main-realm instanceof.
    expect.assertions(2);
    try {
      await checksumInWorker(undefined as unknown as string);
    } catch (err) {
      expect((err as Error).name).toBe('TypeError');
      expect((err as Error).message).toEqual(expect.any(String));
    }
  });

  describe('event loop responsiveness (the whole point)', () => {
    it('the main thread keeps ticking while the worker crunches', async () => {
      const rounds = calibrateRounds();
      let ticks = 0;
      const interval = setInterval(() => {
        ticks += 1;
      }, 10);

      try {
        const digest = await checksumInWorker('large-archive-payload', rounds);
        expect(digest).toBe(checksum('large-archive-payload', rounds));
      } finally {
        clearInterval(interval);
      }

      // ~250ms of hashing at a 10ms interval: demand a conservative floor.
      expect(ticks).toBeGreaterThanOrEqual(3);
    });

    it('contrast: the blocking version starves the very same interval', () => {
      const rounds = calibrateRounds();
      let ticks = 0;
      const interval = setInterval(() => {
        ticks += 1;
      }, 10);

      try {
        checksum('large-archive-payload', rounds); // synchronous — no loop turns
      } finally {
        clearInterval(interval);
      }

      // the event loop never got a turn during the synchronous hash
      expect(ticks).toBe(0);
    });
  });
});
