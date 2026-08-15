import { runSequential, runParallel, runChunked, Task } from './sequential_vs_parallel';

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
}

function trackedTasks<T>(count: number): Tracked<T> {
  const deferreds = Array.from({ length: count }, () => deferred<T>());
  const started = Array.from({ length: count }, () => false);
  const tasks = deferreds.map((d, i) => () => {
    started[i] = true;
    return d.promise;
  });
  return { tasks, deferreds, started };
}

describe('runSequential', () => {
  it('resolves to an empty array for empty input', async () => {
    await expect(runSequential([])).resolves.toEqual([]);
  });

  it('runs tasks one at a time in input order', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(3);
    const result = runSequential(tasks);

    await tick();
    expect(started).toEqual([true, false, false]);

    deferreds[0].resolve('a');
    await tick();
    expect(started).toEqual([true, true, false]);

    deferreds[1].resolve('b');
    await tick();
    expect(started).toEqual([true, true, true]);

    deferreds[2].resolve('c');
    await expect(result).resolves.toEqual(['a', 'b', 'c']);
  });

  it('stops on the first rejection and never starts later tasks', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(3);
    const error = new Error('step failed');
    const result = runSequential(tasks);

    await tick();
    deferreds[0].resolve('a');
    await tick();
    deferreds[1].reject(error);

    await expect(result).rejects.toBe(error);
    await tick();
    expect(started).toEqual([true, true, false]);
  });

  it('resolves a single task', async () => {
    const result = runSequential([() => Promise.resolve(42)]);
    await expect(result).resolves.toEqual([42]);
  });
});

describe('runParallel', () => {
  it('resolves to an empty array for empty input', async () => {
    await expect(runParallel([])).resolves.toEqual([]);
  });

  it('starts every task immediately', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(3);
    const result = runParallel(tasks);

    await tick();
    expect(started).toEqual([true, true, true]);

    deferreds.forEach((d, i) => d.resolve(String(i)));
    await expect(result).resolves.toEqual(['0', '1', '2']);
  });

  it('returns results in input order even when tasks finish out of order', async () => {
    const { tasks, deferreds } = trackedTasks<string>(3);
    const result = runParallel(tasks);

    deferreds[2].resolve('c');
    await tick();
    deferreds[0].resolve('a');
    await tick();
    deferreds[1].resolve('b');

    await expect(result).resolves.toEqual(['a', 'b', 'c']);
  });

  it('fails fast on the first rejection while others are still pending', async () => {
    const { tasks, deferreds } = trackedTasks<string>(3);
    const error = new Error('boom');
    const result = runParallel(tasks);

    deferreds[1].reject(error);
    await expect(result).rejects.toBe(error);

    // settle the stragglers so nothing dangles
    deferreds[0].resolve('a');
    deferreds[2].resolve('c');
    await tick();
  });
});

describe('runChunked', () => {
  it('resolves to an empty array for empty input', async () => {
    await expect(runChunked([], 2)).resolves.toEqual([]);
  });

  it('throws a RangeError synchronously when k < 1', () => {
    expect(() => runChunked([() => Promise.resolve(1)], 0)).toThrow(RangeError);
    expect(() => runChunked([() => Promise.resolve(1)], -1)).toThrow(RangeError);
  });

  it('runs a chunk in parallel and waits for the whole chunk before the next one', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(5);
    const result = runChunked(tasks, 2);

    await tick();
    expect(started).toEqual([true, true, false, false, false]);

    // freeing one slot must NOT start the next chunk — chunk boundary is strict
    deferreds[0].resolve('a');
    await tick();
    expect(started).toEqual([true, true, false, false, false]);

    deferreds[1].resolve('b');
    await tick();
    expect(started).toEqual([true, true, true, true, false]);

    deferreds[2].resolve('c');
    deferreds[3].resolve('d');
    await tick();
    expect(started).toEqual([true, true, true, true, true]);

    deferreds[4].resolve('e');
    await expect(result).resolves.toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('keeps results in input order when a chunk finishes out of order', async () => {
    const { tasks, deferreds } = trackedTasks<string>(4);
    const result = runChunked(tasks, 2);

    await tick();
    deferreds[1].resolve('b');
    await tick();
    deferreds[0].resolve('a');
    await tick();
    deferreds[3].resolve('d');
    await tick();
    deferreds[2].resolve('c');

    await expect(result).resolves.toEqual(['a', 'b', 'c', 'd']);
  });

  it('a rejection skips all later chunks', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(4);
    const error = new Error('chunk failed');
    const result = runChunked(tasks, 2);

    await tick();
    deferreds[0].reject(error);
    deferreds[1].resolve('b');

    await expect(result).rejects.toBe(error);
    await tick();
    expect(started).toEqual([true, true, false, false]);
  });

  it('k = 1 behaves like runSequential', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(3);
    const result = runChunked(tasks, 1);

    await tick();
    expect(started).toEqual([true, false, false]);

    deferreds[0].resolve('a');
    await tick();
    expect(started).toEqual([true, true, false]);

    deferreds[1].resolve('b');
    await tick();
    deferreds[2].resolve('c');

    await expect(result).resolves.toEqual(['a', 'b', 'c']);
  });

  it('k >= tasks.length behaves like runParallel', async () => {
    const { tasks, deferreds, started } = trackedTasks<string>(3);
    const result = runChunked(tasks, 10);

    await tick();
    expect(started).toEqual([true, true, true]);

    deferreds.forEach((d, i) => d.resolve(String(i)));
    await expect(result).resolves.toEqual(['0', '1', '2']);
  });
});
