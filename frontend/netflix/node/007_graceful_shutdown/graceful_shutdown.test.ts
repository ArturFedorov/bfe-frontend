import {
  ShutdownCoordinator,
  ShutdownInProgressError,
  ShutdownOutcome,
  ShutdownTimers,
} from './graceful_shutdown';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

describe('ShutdownCoordinator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const make = (overrides: { drainDeadlineMs?: number; timers?: ShutdownTimers } = {}) => {
    const onForceExit = jest.fn();
    const coordinator = new ShutdownCoordinator({
      drainDeadlineMs: overrides.drainDeadlineMs ?? 10_000,
      onForceExit,
      timers: overrides.timers,
    });
    return { coordinator, onForceExit };
  };

  describe('before any signal', () => {
    it('track passes values and rejections through', async () => {
      const { coordinator } = make();
      await expect(coordinator.track(Promise.resolve('report'))).resolves.toBe('report');
      const boom = new Error('job failed');
      await expect(coordinator.track(Promise.reject(boom))).rejects.toBe(boom);
    });

    it('exposes inFlightCount and isShuttingDown', async () => {
      const { coordinator } = make();
      expect(coordinator.isShuttingDown).toBe(false);
      expect(coordinator.inFlightCount).toBe(0);

      const d1 = deferred();
      const d2 = deferred();
      void coordinator.track(d1.promise);
      void coordinator.track(d2.promise);
      expect(coordinator.inFlightCount).toBe(2);

      d1.resolve();
      await flushMicrotasks();
      expect(coordinator.inFlightCount).toBe(1);
      d2.resolve();
      await flushMicrotasks();
      expect(coordinator.inFlightCount).toBe(0);
    });
  });

  describe('clean drain', () => {
    it('resolves "drained" once every in-flight promise settles', async () => {
      const { coordinator, onForceExit } = make();
      const d1 = deferred();
      const d2 = deferred();
      void coordinator.track(d1.promise);
      void coordinator.track(d2.promise);

      let outcome: ShutdownOutcome | null = null;
      const signal = coordinator.onSignal().then((o) => {
        outcome = o;
        return o;
      });

      await flushMicrotasks();
      expect(outcome).toBeNull(); // still draining

      d1.resolve();
      await flushMicrotasks();
      expect(outcome).toBeNull(); // one job still running

      d2.resolve();
      await expect(signal).resolves.toBe('drained');
      expect(onForceExit).not.toHaveBeenCalled();
    });

    it('a REJECTED in-flight job still counts as drained', async () => {
      const { coordinator, onForceExit } = make();
      const d = deferred();
      coordinator.track(d.promise).catch(() => undefined);

      const signal = coordinator.onSignal();
      d.reject(new Error('half-written report'));
      await expect(signal).resolves.toBe('drained');
      expect(onForceExit).not.toHaveBeenCalled();
    });

    it('clears the deadline timer on clean drain (no late force-exit)', async () => {
      const { coordinator, onForceExit } = make({ drainDeadlineMs: 5_000 });
      const d = deferred();
      void coordinator.track(d.promise);

      const signal = coordinator.onSignal();
      d.resolve();
      await expect(signal).resolves.toBe('drained');

      jest.advanceTimersByTime(60_000);
      expect(onForceExit).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('clears the deadline through injected timers too', async () => {
      const handles: unknown[] = [];
      const cleared: unknown[] = [];
      const timers: ShutdownTimers = {
        setTimeout: (cb, ms) => {
          const handle = setTimeout(cb, ms);
          handles.push(handle);
          return handle;
        },
        clearTimeout: (handle) => {
          cleared.push(handle);
          clearTimeout(handle as NodeJS.Timeout);
        },
      };
      const { coordinator } = make({ timers });
      const d = deferred();
      void coordinator.track(d.promise);
      const signal = coordinator.onSignal();
      expect(handles).toHaveLength(1);

      d.resolve();
      await expect(signal).resolves.toBe('drained');
      expect(cleared).toEqual([handles[0]]);
    });

    it('resolves "drained" immediately with nothing in flight — deadline never scheduled', async () => {
      const timerSpy = jest.fn((cb: () => void, ms: number) => setTimeout(cb, ms));
      const { coordinator, onForceExit } = make({
        timers: { setTimeout: timerSpy, clearTimeout: (h) => clearTimeout(h as NodeJS.Timeout) },
      });
      await expect(coordinator.onSignal()).resolves.toBe('drained');
      expect(timerSpy).not.toHaveBeenCalled();
      expect(onForceExit).not.toHaveBeenCalled();
    });
  });

  describe('forced exit', () => {
    it('resolves "forced" and calls onForceExit exactly once when the deadline fires', async () => {
      const { coordinator, onForceExit } = make({ drainDeadlineMs: 30_000 });
      const stuck = deferred();
      void coordinator.track(stuck.promise);

      const signal = coordinator.onSignal();
      jest.advanceTimersByTime(29_999);
      await flushMicrotasks();
      expect(onForceExit).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      await expect(signal).resolves.toBe('forced');
      expect(onForceExit).toHaveBeenCalledTimes(1);
    });

    it('a job settling AFTER the force does not fire anything twice', async () => {
      const { coordinator, onForceExit } = make({ drainDeadlineMs: 1_000 });
      const stuck = deferred();
      void coordinator.track(stuck.promise);

      const signal = coordinator.onSignal();
      jest.advanceTimersByTime(1_000);
      await expect(signal).resolves.toBe('forced');

      stuck.resolve(); // finally settles, too late
      await flushMicrotasks();
      expect(onForceExit).toHaveBeenCalledTimes(1);
      await expect(signal).resolves.toBe('forced'); // outcome unchanged
    });
  });

  describe('during drain', () => {
    it('rejects new work immediately with ShutdownInProgressError', async () => {
      const { coordinator } = make();
      const d = deferred();
      void coordinator.track(d.promise);
      void coordinator.onSignal();

      expect(coordinator.isShuttingDown).toBe(true);
      await expect(coordinator.track(Promise.resolve('late job'))).rejects.toBeInstanceOf(
        ShutdownInProgressError,
      );
      // the rejected work was never added to the drain set
      expect(coordinator.inFlightCount).toBe(1);

      d.resolve();
      await flushMicrotasks();
    });

    it('onSignal is idempotent — repeated calls return the same promise', async () => {
      const { coordinator } = make();
      const d = deferred();
      void coordinator.track(d.promise);

      const first = coordinator.onSignal();
      const second = coordinator.onSignal();
      expect(second).toBe(first);

      d.resolve();
      await expect(first).resolves.toBe('drained');
      await expect(coordinator.onSignal()).resolves.toBe('drained');
    });
  });
});
