import { AsyncQueue } from './async_queue';

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

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

/** Creates a controllable task that records when it starts. */
function makeTask<T>(name: string, startLog: string[]) {
  const d = deferred<T>();
  const fn = jest.fn((): Promise<T> => {
    startLog.push(name);
    return d.promise;
  });
  return { fn, d };
}

describe('AsyncQueue', () => {
  describe('happy path', () => {
    it('runs a single task and resolves with its value', async () => {
      const queue = new AsyncQueue();
      await expect(queue.enqueue(() => Promise.resolve(42))).resolves.toBe(42);
    });

    it('resolves each promise with its own task result', async () => {
      const queue = new AsyncQueue();
      const a = queue.enqueue(() => Promise.resolve('first'));
      const b = queue.enqueue(() => Promise.resolve('second'));
      await expect(a).resolves.toBe('first');
      await expect(b).resolves.toBe('second');
    });
  });

  describe('serial execution', () => {
    it('does not start the second task until the first settles', async () => {
      const queue = new AsyncQueue();
      const startLog: string[] = [];
      const t1 = makeTask<string>('t1', startLog);
      const t2 = makeTask<string>('t2', startLog);

      const p1 = queue.enqueue(t1.fn);
      const p2 = queue.enqueue(t2.fn);
      await flush();

      expect(startLog).toEqual(['t1']);
      expect(t2.fn).not.toHaveBeenCalled();

      t1.d.resolve('one');
      await flush();
      expect(startLog).toEqual(['t1', 't2']);

      t2.d.resolve('two');
      await expect(p1).resolves.toBe('one');
      await expect(p2).resolves.toBe('two');
    });

    it('never has more than one task in flight', async () => {
      const queue = new AsyncQueue();
      let active = 0;
      let maxActive = 0;
      const promises: Promise<number>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          queue.enqueue(async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await flush();
            active--;
            return i;
          }),
        );
      }
      await expect(Promise.all(promises)).resolves.toEqual([0, 1, 2, 3, 4]);
      expect(maxActive).toBe(1);
    });
  });

  describe('FIFO ordering', () => {
    it('starts tasks in exact arrival order', async () => {
      const queue = new AsyncQueue();
      const startLog: string[] = [];
      const tasks = ['a', 'b', 'c', 'd'].map((name) =>
        makeTask<string>(name, startLog),
      );
      const promises = tasks.map((t) => queue.enqueue(t.fn));

      for (const t of tasks) {
        await flush();
        t.d.resolve('done');
      }
      await Promise.all(promises);
      expect(startLog).toEqual(['a', 'b', 'c', 'd']);
    });

    it('appends tasks enqueued while another task is running', async () => {
      const queue = new AsyncQueue();
      const startLog: string[] = [];
      const t1 = makeTask<string>('t1', startLog);
      const p1 = queue.enqueue(t1.fn);
      await flush();

      // enqueue while t1 is mid-flight
      const t2 = makeTask<string>('t2', startLog);
      const p2 = queue.enqueue(t2.fn);
      await flush();
      expect(startLog).toEqual(['t1']);

      t1.d.resolve('one');
      await flush();
      expect(startLog).toEqual(['t1', 't2']);
      t2.d.resolve('two');
      await Promise.all([p1, p2]);
    });

    it('accepts new tasks after the queue has fully drained', async () => {
      const queue = new AsyncQueue();
      await queue.enqueue(() => Promise.resolve('first batch'));
      await flush();
      await expect(
        queue.enqueue(() => Promise.resolve('second batch')),
      ).resolves.toBe('second batch');
    });
  });

  describe('rejection handling', () => {
    it('rejects the failing task promise with its own reason', async () => {
      const queue = new AsyncQueue();
      const boom = new Error('disk full');
      await expect(queue.enqueue(() => Promise.reject(boom))).rejects.toBe(
        boom,
      );
    });

    it('continues with the next task after a rejection', async () => {
      const queue = new AsyncQueue();
      const startLog: string[] = [];
      const bad = queue.enqueue(() => {
        startLog.push('bad');
        return Promise.reject(new Error('nope'));
      });
      const good = queue.enqueue(() => {
        startLog.push('good');
        return Promise.resolve('recovered');
      });

      await expect(bad).rejects.toThrow('nope');
      await expect(good).resolves.toBe('recovered');
      expect(startLog).toEqual(['bad', 'good']);
    });

    it('keeps FIFO order across multiple failures', async () => {
      const queue = new AsyncQueue();
      const startLog: string[] = [];
      const results = [
        queue.enqueue(() => {
          startLog.push('f1');
          return Promise.reject(new Error('e1'));
        }),
        queue.enqueue(() => {
          startLog.push('ok');
          return Promise.resolve('v');
        }),
        queue.enqueue(() => {
          startLog.push('f2');
          return Promise.reject(new Error('e2'));
        }),
      ];
      await expect(results[0]).rejects.toThrow('e1');
      await expect(results[1]).resolves.toBe('v');
      await expect(results[2]).rejects.toThrow('e2');
      expect(startLog).toEqual(['f1', 'ok', 'f2']);
    });

    it('does not start the next task before a rejecting task settles', async () => {
      const queue = new AsyncQueue();
      const startLog: string[] = [];
      const t1 = makeTask<string>('t1', startLog);
      const p1 = queue.enqueue(t1.fn);
      const p2 = queue.enqueue(() => {
        startLog.push('t2');
        return Promise.resolve('two');
      });
      await flush();
      expect(startLog).toEqual(['t1']);

      t1.d.reject(new Error('failed mid-write'));
      await expect(p1).rejects.toThrow('failed mid-write');
      await expect(p2).resolves.toBe('two');
      expect(startLog).toEqual(['t1', 't2']);
    });
  });
});
