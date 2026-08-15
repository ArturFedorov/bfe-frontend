import { runPool, PoolError, Task } from './concurrency_pool';

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

interface Tracked<T> {
  tasks: Array<Task<T>>;
  deferreds: Array<Deferred<T>>;
  started: boolean[];
  inFlight: () => number;
  maxInFlight: () => number;
}

function trackedTasks<T>(count: number): Tracked<T> {
  const deferreds = Array.from({ length: count }, () => deferred<T>());
  const started = Array.from({ length: count }, () => false);
  let inFlight = 0;
  let maxInFlight = 0;
  const settle = () => {
    inFlight -= 1;
  };
  const tasks = deferreds.map((d, i) => () => {
    started[i] = true;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    d.promise.then(settle, settle);
    return d.promise;
  });
  return {
    tasks,
    deferreds,
    started,
    inFlight: () => inFlight,
    maxInFlight: () => maxInFlight,
  };
}

describe('runPool', () => {
  it('resolves to an empty array for empty input', async () => {
    await expect(runPool([], 3)).resolves.toEqual([]);
  });

  it('throws a RangeError synchronously when k < 1', () => {
    expect(() => runPool([() => Promise.resolve(1)], 0)).toThrow(RangeError);
    expect(() => runPool([() => Promise.resolve(1)], -2)).toThrow(RangeError);
  });

  describe('concurrency limit', () => {
    it('never exceeds k in flight and refills a slot the moment a task settles', async () => {
      const t = trackedTasks<string>(5);
      const result = runPool(t.tasks, 2);

      await tick();
      expect(t.started).toEqual([true, true, false, false, false]);

      // settling one task frees a slot immediately — no chunk boundary
      t.deferreds[0].resolve('a');
      await tick();
      expect(t.started).toEqual([true, true, true, false, false]);

      t.deferreds[1].resolve('b');
      t.deferreds[2].resolve('c');
      await tick();
      expect(t.started).toEqual([true, true, true, true, true]);

      t.deferreds[3].resolve('d');
      t.deferreds[4].resolve('e');
      await expect(result).resolves.toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(t.maxInFlight()).toBe(2);
    });

    it('k = 1 behaves like strict sequential execution', async () => {
      const t = trackedTasks<number>(3);
      const result = runPool(t.tasks, 1);

      await tick();
      expect(t.started).toEqual([true, false, false]);

      t.deferreds[0].resolve(1);
      await tick();
      expect(t.started).toEqual([true, true, false]);

      t.deferreds[1].resolve(2);
      await tick();
      expect(t.started).toEqual([true, true, true]);

      t.deferreds[2].resolve(3);
      await expect(result).resolves.toEqual([1, 2, 3]);
      expect(t.maxInFlight()).toBe(1);
    });

    it('k >= tasks.length starts everything immediately (parallel)', async () => {
      const t = trackedTasks<number>(3);
      const result = runPool(t.tasks, 10);

      await tick();
      expect(t.started).toEqual([true, true, true]);

      t.deferreds.forEach((d, i) => d.resolve(i));
      await expect(result).resolves.toEqual([0, 1, 2]);
    });
  });

  describe('ordering', () => {
    it('returns results in input order despite out-of-order completion', async () => {
      const t = trackedTasks<string>(4);
      const result = runPool(t.tasks, 4);

      t.deferreds[3].resolve('d');
      await tick();
      t.deferreds[1].resolve('b');
      await tick();
      t.deferreds[0].resolve('a');
      await tick();
      t.deferreds[2].resolve('c');

      await expect(result).resolves.toEqual(['a', 'b', 'c', 'd']);
    });

    it('starts tasks in input order', async () => {
      const startOrder: number[] = [];
      const deferreds = Array.from({ length: 4 }, () => deferred<number>());
      const tasks = deferreds.map((d, i) => () => {
        startOrder.push(i);
        return d.promise;
      });

      const result = runPool(tasks, 2);
      await tick();
      expect(startOrder).toEqual([0, 1]);

      deferreds[1].resolve(1);
      await tick();
      expect(startOrder).toEqual([0, 1, 2]);

      deferreds[0].resolve(0);
      await tick();
      expect(startOrder).toEqual([0, 1, 2, 3]);

      deferreds[2].resolve(2);
      deferreds[3].resolve(3);
      await result.catch(() => undefined);
    });
  });

  describe('failure handling', () => {
    it('a rejection does not stall the pool — remaining tasks still run', async () => {
      const t = trackedTasks<string>(4);
      const error = new Error('task 0 failed');
      const result = runPool(t.tasks, 2);
      const outcome = result.catch((e: unknown) => e);

      await tick();
      t.deferreds[0].reject(error);
      await tick();
      // the failure freed a slot and the next task started anyway
      expect(t.started).toEqual([true, true, true, false]);

      t.deferreds[1].resolve('b');
      await tick();
      expect(t.started).toEqual([true, true, true, true]);

      t.deferreds[2].resolve('c');
      t.deferreds[3].resolve('d');

      const caught = await outcome;
      expect(caught).toBeInstanceOf(PoolError);
      expect((caught as PoolError).errors).toEqual([error]);
    });

    it('rejects only after every task has settled', async () => {
      const t = trackedTasks<string>(3);
      const error = new Error('early failure');
      let settled = false;

      const result = runPool(t.tasks, 3);
      const outcome = result.catch((e: unknown) => e);
      outcome.then(() => {
        settled = true;
      });

      t.deferreds[0].reject(error);
      await tick();
      expect(settled).toBe(false); // two tasks still pending

      t.deferreds[1].resolve('b');
      await tick();
      expect(settled).toBe(false);

      t.deferreds[2].resolve('c');
      await tick();
      expect(settled).toBe(true);
      expect(await outcome).toBeInstanceOf(PoolError);
    });

    it('collects multiple rejection reasons in input order', async () => {
      const t = trackedTasks<string>(4);
      const first = new Error('first');
      const third = new Error('third');
      const outcome = runPool(t.tasks, 4).catch((e: unknown) => e);

      await tick();
      t.deferreds[2].reject(third); // fails before the earlier-indexed task
      await tick();
      t.deferreds[0].reject(first);
      t.deferreds[1].resolve('b');
      t.deferreds[3].resolve('d');

      const caught = (await outcome) as PoolError;
      expect(caught).toBeInstanceOf(PoolError);
      expect(caught.errors).toEqual([first, third]); // input order, not failure order
      expect(caught.name).toBe('PoolError');
    });
  });
});
