import { LazyPromise } from './lazy_promise';

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

describe('LazyPromise', () => {
  describe('laziness', () => {
    it('does not run the executor at construction time', () => {
      let calls = 0;
      new LazyPromise<number>((resolve) => {
        calls += 1;
        resolve(1);
      });
      expect(calls).toBe(0);
    });

    it('runs the executor on the first .then', async () => {
      let calls = 0;
      const lazy = new LazyPromise<number>((resolve) => {
        calls += 1;
        resolve(7);
      });

      expect(calls).toBe(0);
      const result = lazy.then((v) => v);
      expect(calls).toBe(1);
      await expect(result).resolves.toBe(7);
    });

    it('runs the executor on the first .catch', async () => {
      let calls = 0;
      const error = new Error('nope');
      const lazy = new LazyPromise<never>((_, reject) => {
        calls += 1;
        reject(error);
      });

      expect(calls).toBe(0);
      const caught = lazy.catch((e) => e);
      expect(calls).toBe(1);
      await expect(caught).resolves.toBe(error);
    });

    it('runs the executor when awaited', async () => {
      let calls = 0;
      const lazy = new LazyPromise<string>((resolve) => {
        calls += 1;
        resolve('done');
      });

      const value = await lazy;
      expect(value).toBe('done');
      expect(calls).toBe(1);
    });
  });

  describe('exactly-once semantics', () => {
    it('runs the executor once even with two concurrent awaiters', async () => {
      let calls = 0;
      const gate = deferred<number>();
      const lazy = new LazyPromise<number>((resolve) => {
        calls += 1;
        gate.promise.then(resolve);
      });

      const first = lazy.then((v) => v);
      const second = lazy.then((v) => v * 10);
      expect(calls).toBe(1);

      gate.resolve(5);
      await expect(first).resolves.toBe(5);
      await expect(second).resolves.toBe(50);
      expect(calls).toBe(1);
    });

    it('runs the executor once when a consumer attaches after settlement', async () => {
      let calls = 0;
      const lazy = new LazyPromise<number>((resolve) => {
        calls += 1;
        resolve(3);
      });

      await expect(lazy.then((v) => v)).resolves.toBe(3);
      await tick();
      await expect(lazy.then((v) => v + 1)).resolves.toBe(4);
      expect(calls).toBe(1);
    });

    it('runs the executor once across mixed .then and .catch consumers', async () => {
      let calls = 0;
      const error = new Error('shared failure');
      const lazy = new LazyPromise<never>((_, reject) => {
        calls += 1;
        reject(error);
      });

      const viaCatch = lazy.catch((e) => e);
      const viaThen = lazy.then(undefined, (e) => e);

      await expect(viaCatch).resolves.toBe(error);
      await expect(viaThen).resolves.toBe(error);
      expect(calls).toBe(1);
    });
  });

  describe('resolution and rejection plumbing', () => {
    it('delivers the same value to every consumer', async () => {
      const lazy = new LazyPromise<{ id: number }>((resolve) =>
        resolve({ id: 1 }),
      );

      const [a, b] = await Promise.all([
        lazy.then((v) => v),
        lazy.then((v) => v),
      ]);
      expect(a).toEqual({ id: 1 });
      expect(a).toBe(b);
    });

    it('supports async resolution via a deferred executor', async () => {
      const gate = deferred<string>();
      const lazy = new LazyPromise<string>((resolve) => {
        gate.promise.then(resolve);
      });

      const result = lazy.then((v) => v.toUpperCase());
      await tick();
      gate.resolve('later');

      await expect(result).resolves.toBe('LATER');
    });

    it('propagates rejection to .then onrejected handlers', async () => {
      const error = new Error('bad');
      const lazy = new LazyPromise<number>((_, reject) => reject(error));

      await expect(lazy.then((v) => v)).rejects.toBe(error);
    });

    it('chains: then returns a promise usable for further transforms', async () => {
      const lazy = new LazyPromise<number>((resolve) => resolve(2));

      const result = await lazy.then((v) => v * 3).then((v) => v + 1);
      expect(result).toBe(7);
    });

    it('catch recovers and yields a fallback value', async () => {
      const lazy = new LazyPromise<number>((_, reject) =>
        reject(new Error('x')),
      );

      await expect(lazy.catch(() => -1)).resolves.toBe(-1);
    });
  });
});
