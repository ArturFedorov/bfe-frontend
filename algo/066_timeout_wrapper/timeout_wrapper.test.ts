import { withTimeout, TimeoutError } from './timeout_wrapper';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('happy path', () => {
    it('resolves with the value when the promise settles before the deadline', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 100);
      d.resolve('ok');
      await expect(wrapped).resolves.toBe('ok');
    });

    it('preserves the resolved value type and identity', async () => {
      const payload = { id: 7, items: [1, 2, 3] };
      const d = deferred<typeof payload>();
      const wrapped = withTimeout(d.promise, 50);
      d.resolve(payload);
      await expect(wrapped).resolves.toBe(payload);
    });

    it('resolves even when the promise settles just before the deadline', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 100);
      let settled = false;
      wrapped.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        }
      );
      await jest.advanceTimersByTimeAsync(99);
      expect(settled).toBe(false);
      d.resolve('just in time');
      await expect(wrapped).resolves.toBe('just in time');
    });
  });

  describe('rejection paths', () => {
    it('rejects with the original reason when the promise rejects first', async () => {
      const boom = new Error('boom');
      const d = deferred<never>();
      const wrapped = withTimeout(d.promise, 100);
      d.reject(boom);
      await expect(wrapped).rejects.toBe(boom);
    });

    it('rejects with TimeoutError once ms elapse without settlement', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 100);
      const assertion = expect(wrapped).rejects.toBeInstanceOf(TimeoutError);
      await jest.advanceTimersByTimeAsync(100);
      await assertion;
    });

    it('does not reject with TimeoutError before the deadline', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 200);
      let settled = false;
      wrapped.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        }
      );
      await jest.advanceTimersByTimeAsync(199);
      expect(settled).toBe(false);
      // let the timeout fire so no timer leaks into the next test
      const assertion = expect(wrapped).rejects.toBeInstanceOf(TimeoutError);
      await jest.advanceTimersByTimeAsync(1);
      await assertion;
    });

    it('ignores a late settlement of the original promise after timing out', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 100);
      const assertion = expect(wrapped).rejects.toBeInstanceOf(TimeoutError);
      await jest.advanceTimersByTimeAsync(100);
      await assertion;
      // late resolve must not throw or change the outcome
      d.resolve('too late');
      await jest.advanceTimersByTimeAsync(0);
      await expect(wrapped).rejects.toBeInstanceOf(TimeoutError);
    });
  });

  describe('timer cleanup', () => {
    it('clears the timer when the promise resolves first', async () => {
      const d = deferred<number>();
      const wrapped = withTimeout(d.promise, 10000);
      d.resolve(42);
      await wrapped;
      expect(jest.getTimerCount()).toBe(0);
    });

    it('clears the timer when the promise rejects first', async () => {
      const d = deferred<never>();
      const wrapped = withTimeout(d.promise, 10000);
      d.reject(new Error('early failure'));
      await expect(wrapped).rejects.toThrow('early failure');
      expect(jest.getTimerCount()).toBe(0);
    });

    it('leaves no timer behind after the timeout fires', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 100);
      const assertion = expect(wrapped).rejects.toBeInstanceOf(TimeoutError);
      await jest.advanceTimersByTimeAsync(100);
      await assertion;
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('TimeoutError contract', () => {
    it('is an Error with name TimeoutError', () => {
      const err = new TimeoutError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(TimeoutError);
      expect(err.name).toBe('TimeoutError');
    });

    it('rejects with an instance distinguishable from generic errors', async () => {
      const d = deferred<string>();
      const wrapped = withTimeout(d.promise, 100);
      const caught = wrapped.catch((e: unknown) => e);
      await jest.advanceTimersByTimeAsync(100);
      const err = await caught;
      expect(err instanceof TimeoutError).toBe(true);
    });
  });

  describe('independence', () => {
    it('times out each wrapped promise independently', async () => {
      const a = deferred<string>();
      const b = deferred<string>();
      const wrappedA = withTimeout(a.promise, 100);
      const wrappedB = withTimeout(b.promise, 300);
      const assertionA = expect(wrappedA).rejects.toBeInstanceOf(TimeoutError);
      await jest.advanceTimersByTimeAsync(100);
      await assertionA;
      b.resolve('b survives');
      await expect(wrappedB).resolves.toBe('b survives');
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
