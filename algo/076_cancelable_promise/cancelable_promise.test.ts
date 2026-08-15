import { cancelable, AbortError } from './cancelable_promise';

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

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('cancelable', () => {
  describe('pass-through settlement', () => {
    it('resolves with the underlying value and runs cleanup once', async () => {
      const controller = new AbortController();
      const d = deferred<string>();
      let cleanups = 0;

      const result = cancelable(() => d.promise, controller.signal, () => {
        cleanups += 1;
      });

      d.resolve('data');
      await expect(result).resolves.toBe('data');
      await tick();
      expect(cleanups).toBe(1);
    });

    it('rejects with the underlying error and runs cleanup once', async () => {
      const controller = new AbortController();
      const d = deferred<string>();
      const error = new Error('network down');
      let cleanups = 0;

      const result = cancelable(() => d.promise, controller.signal, () => {
        cleanups += 1;
      });

      d.reject(error);
      await expect(result).rejects.toBe(error);
      await tick();
      expect(cleanups).toBe(1);
    });

    it('invokes the factory exactly once', async () => {
      const controller = new AbortController();
      let factoryCalls = 0;

      const result = cancelable(() => {
        factoryCalls += 1;
        return Promise.resolve(1);
      }, controller.signal);

      await expect(result).resolves.toBe(1);
      expect(factoryCalls).toBe(1);
    });

    it('works without a cleanup callback', async () => {
      const controller = new AbortController();
      await expect(cancelable(() => Promise.resolve('ok'), controller.signal)).resolves.toBe('ok');
    });
  });

  describe('abort mid-flight', () => {
    it('rejects with an AbortError when the signal aborts before settlement', async () => {
      const controller = new AbortController();
      const d = deferred<string>();

      const result = cancelable(() => d.promise, controller.signal);
      controller.abort();

      await expect(result).rejects.toBeInstanceOf(AbortError);
    });

    it('the AbortError has name "AbortError"', async () => {
      const controller = new AbortController();
      const d = deferred<string>();

      const result = cancelable(() => d.promise, controller.signal);
      controller.abort();

      await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('runs cleanup exactly once on abort', async () => {
      const controller = new AbortController();
      const d = deferred<string>();
      let cleanups = 0;

      const result = cancelable(() => d.promise, controller.signal, () => {
        cleanups += 1;
      });
      controller.abort();

      await expect(result).rejects.toBeInstanceOf(AbortError);
      await tick();
      expect(cleanups).toBe(1);
    });

    it('ignores a late settlement of the underlying promise after abort', async () => {
      const controller = new AbortController();
      const d = deferred<string>();
      let cleanups = 0;

      const result = cancelable(() => d.promise, controller.signal, () => {
        cleanups += 1;
      });
      controller.abort();
      await expect(result).rejects.toBeInstanceOf(AbortError);

      d.resolve('too late');
      await tick();
      // still rejected, and cleanup did not run a second time
      await expect(result).rejects.toBeInstanceOf(AbortError);
      expect(cleanups).toBe(1);
    });
  });

  describe('already-aborted signal', () => {
    it('rejects immediately with AbortError without invoking the factory', async () => {
      const controller = new AbortController();
      controller.abort();
      let factoryCalls = 0;

      const result = cancelable(() => {
        factoryCalls += 1;
        return Promise.resolve('never');
      }, controller.signal);

      await expect(result).rejects.toBeInstanceOf(AbortError);
      expect(factoryCalls).toBe(0);
    });

    it('still runs cleanup exactly once', async () => {
      const controller = new AbortController();
      controller.abort();
      let cleanups = 0;

      const result = cancelable(
        () => Promise.resolve('never'),
        controller.signal,
        () => {
          cleanups += 1;
        }
      );

      await expect(result).rejects.toBeInstanceOf(AbortError);
      await tick();
      expect(cleanups).toBe(1);
    });
  });

  describe('abort after settlement', () => {
    it('is a no-op: the resolved value stands and cleanup stays at one call', async () => {
      const controller = new AbortController();
      const d = deferred<string>();
      let cleanups = 0;

      const result = cancelable(() => d.promise, controller.signal, () => {
        cleanups += 1;
      });

      d.resolve('done');
      await expect(result).resolves.toBe('done');
      await tick();

      controller.abort();
      await tick();

      await expect(result).resolves.toBe('done');
      expect(cleanups).toBe(1);
    });
  });
});
