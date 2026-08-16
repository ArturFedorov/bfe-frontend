import { CircuitBreaker, CircuitOpenError } from './circuit_breaker';

const failWith = (message: string) => (): Promise<never> =>
  Promise.reject(new Error(message));

const succeedWith =
  <T>(value: T) =>
  (): Promise<T> =>
    Promise.resolve(value);

/** Drives the breaker to the open state with n consecutive failures. */
async function trip(breaker: CircuitBreaker, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await expect(breaker.exec(failWith('service down'))).rejects.toThrow(
      'service down',
    );
  }
}

describe('CircuitBreaker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('closed state (happy path)', () => {
    it('passes successful calls through and resolves with their value', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 1000,
      });
      await expect(breaker.exec(succeedWith('ok'))).resolves.toBe('ok');
      await expect(breaker.exec(succeedWith(42))).resolves.toBe(42);
    });

    it('propagates the original error while below the threshold', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 1000,
      });
      const boom = new Error('boom');
      await expect(breaker.exec(() => Promise.reject(boom))).rejects.toBe(boom);
      // still closed: the next call reaches the service
      const fn = jest.fn(succeedWith('still closed'));
      await expect(breaker.exec(fn)).resolves.toBe('still closed');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('a success resets the consecutive-failure counter', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 1000,
      });
      await trip(breaker, 2);
      await expect(breaker.exec(succeedWith('reset'))).resolves.toBe('reset');
      await trip(breaker, 2);
      // 2 + 2 failures with a success between → never reached 3 consecutive
      const fn = jest.fn(succeedWith('still closed'));
      await expect(breaker.exec(fn)).resolves.toBe('still closed');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('opening the circuit', () => {
    it('opens after failureThreshold consecutive failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 1000,
      });
      await trip(breaker, 3);
      await expect(breaker.exec(succeedWith('nope'))).rejects.toBeInstanceOf(
        CircuitOpenError,
      );
    });

    it('does not invoke fn while open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 1000,
      });
      await trip(breaker, 2);
      const fn = jest.fn(succeedWith('unreachable'));
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();
    });

    it('stays open just before the cooldown elapses', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownMs: 1000,
      });
      await trip(breaker, 1);
      await jest.advanceTimersByTimeAsync(999);
      const fn = jest.fn(succeedWith('too early'));
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('half-open probe', () => {
    it('lets one probe through after the cooldown and closes on success', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 1000,
      });
      await trip(breaker, 2);
      await jest.advanceTimersByTimeAsync(1000);

      const probe = jest.fn(succeedWith('recovered'));
      await expect(breaker.exec(probe)).resolves.toBe('recovered');
      expect(probe).toHaveBeenCalledTimes(1);

      // circuit is closed again: calls pass through normally
      const fn = jest.fn(succeedWith('normal traffic'));
      await expect(breaker.exec(fn)).resolves.toBe('normal traffic');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('a successful probe fully resets the failure counter', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 1000,
      });
      await trip(breaker, 2);
      await jest.advanceTimersByTimeAsync(1000);
      await expect(breaker.exec(succeedWith('probe ok'))).resolves.toBe(
        'probe ok',
      );

      // one more failure must NOT open the circuit (threshold is 2)
      await expect(breaker.exec(failWith('single failure'))).rejects.toThrow(
        'single failure',
      );
      const fn = jest.fn(succeedWith('still closed'));
      await expect(breaker.exec(fn)).resolves.toBe('still closed');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('a failed probe re-opens the circuit for another full cooldown', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 1000,
      });
      await trip(breaker, 2);
      await jest.advanceTimersByTimeAsync(1000);

      // probe fails → re-open
      await expect(breaker.exec(failWith('still down'))).rejects.toThrow(
        'still down',
      );

      const fn = jest.fn(succeedWith('blocked'));
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();

      // not yet: cooldown restarted at probe failure
      await jest.advanceTimersByTimeAsync(999);
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();

      // second probe succeeds → closed
      await jest.advanceTimersByTimeAsync(1);
      await expect(breaker.exec(fn)).resolves.toBe('blocked');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('propagates the probe error itself unchanged', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownMs: 500,
      });
      await trip(breaker, 1);
      await jest.advanceTimersByTimeAsync(500);
      const probeError = new Error('probe exploded');
      await expect(breaker.exec(() => Promise.reject(probeError))).rejects.toBe(
        probeError,
      );
    });
  });

  describe('injectable clock', () => {
    it('uses options.now instead of real time', async () => {
      let t = 0;
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownMs: 500,
        now: () => t,
      });
      await trip(breaker, 1);

      const fn = jest.fn(succeedWith('ok'));
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();

      t = 499;
      await expect(breaker.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();

      t = 500;
      await expect(breaker.exec(fn)).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('CircuitOpenError contract', () => {
    it('is an Error with name CircuitOpenError', () => {
      const err = new CircuitOpenError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(CircuitOpenError);
      expect(err.name).toBe('CircuitOpenError');
    });
  });
});
