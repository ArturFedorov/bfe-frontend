import { runTaskGraph, TaskDef } from './dependency_task_runner';

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

/** A controllable task that records when it starts. */
function makeTask(id: string, deps: string[], startLog: string[]) {
  const d = deferred<void>();
  const task: TaskDef = {
    id,
    deps,
    run: jest.fn(() => {
      startLog.push(id);
      return d.promise;
    }),
  };
  return { task, d };
}

/** A task that settles on its own after one macrotask. */
function autoTask(id: string, deps: string[], startLog?: string[]): TaskDef {
  return {
    id,
    deps,
    run: () => {
      startLog?.push(id);
      return flush();
    },
  };
}

describe('runTaskGraph', () => {
  describe('happy path', () => {
    it('runs a single task and reports it fulfilled', async () => {
      await expect(
        runTaskGraph([autoTask('a', [])], 1)
      ).resolves.toEqual({ a: 'fulfilled' });
    });

    it('runs a linear chain in dependency order', async () => {
      const startLog: string[] = [];
      const statuses = await runTaskGraph(
        [
          autoTask('c', ['b'], startLog),
          autoTask('a', [], startLog),
          autoTask('b', ['a'], startLog),
        ],
        2
      );
      expect(startLog).toEqual(['a', 'b', 'c']);
      expect(statuses).toEqual({
        a: 'fulfilled',
        b: 'fulfilled',
        c: 'fulfilled',
      });
    });

    it('does not start a task before its dependency fulfills', async () => {
      const startLog: string[] = [];
      const a = makeTask('a', [], startLog);
      const b = makeTask('b', ['a'], startLog);

      const result = runTaskGraph([a.task, b.task], 2);
      await flush();
      expect(startLog).toEqual(['a']);
      expect(b.task.run).not.toHaveBeenCalled();

      a.d.resolve();
      await flush();
      expect(startLog).toEqual(['a', 'b']);

      b.d.resolve();
      await expect(result).resolves.toEqual({
        a: 'fulfilled',
        b: 'fulfilled',
      });
    });
  });

  describe('concurrency limit', () => {
    it('never exceeds n tasks in flight', async () => {
      let active = 0;
      let maxActive = 0;
      const tasks: TaskDef[] = Array.from({ length: 6 }, (_, i) => ({
        id: `t${i}`,
        deps: [],
        run: async () => {
          active++;
          maxActive = Math.max(maxActive, active);
          await flush();
          active--;
        },
      }));

      const statuses = await runTaskGraph(tasks, 2);
      expect(maxActive).toBe(2);
      expect(Object.values(statuses)).toEqual(
        new Array(6).fill('fulfilled')
      );
    });

    it('holds ready tasks until a slot frees', async () => {
      const startLog: string[] = [];
      const a = makeTask('a', [], startLog);
      const b = makeTask('b', [], startLog);
      const c = makeTask('c', [], startLog);

      const result = runTaskGraph([a.task, b.task, c.task], 2);
      await flush();
      expect(startLog).toHaveLength(2);
      expect(c.task.run).not.toHaveBeenCalled();

      a.d.resolve();
      await flush();
      expect(startLog).toHaveLength(3);
      expect(c.task.run).toHaveBeenCalledTimes(1);

      b.d.resolve();
      c.d.resolve();
      await result;
    });
  });

  describe('eager (non-batched) scheduling', () => {
    it('starts a dependent the moment its dep finishes, while a slow sibling still runs', async () => {
      const startLog: string[] = [];
      const fast = makeTask('fast', [], startLog);
      const slow = makeTask('slow', [], startLog);
      const child = makeTask('child', ['fast'], startLog);

      const result = runTaskGraph([fast.task, slow.task, child.task], 2);
      await flush();
      expect(startLog.sort()).toEqual(['fast', 'slow']);

      fast.d.resolve();
      await flush();
      // child must start even though slow has not finished (no level barrier)
      expect(startLog).toContain('child');
      expect(slow.task.run).toHaveBeenCalledTimes(1);

      slow.d.resolve();
      child.d.resolve();
      await expect(result).resolves.toEqual({
        fast: 'fulfilled',
        slow: 'fulfilled',
        child: 'fulfilled',
      });
    });
  });

  describe('diamond dependencies', () => {
    it('runs a shared dependency exactly once and joins at the bottom', async () => {
      const startLog: string[] = [];
      const a = makeTask('a', [], startLog);
      const b = makeTask('b', ['a'], startLog);
      const c = makeTask('c', ['a'], startLog);
      const d = makeTask('d', ['b', 'c'], startLog);

      const result = runTaskGraph([a.task, b.task, c.task, d.task], 4);
      await flush();
      expect(a.task.run).toHaveBeenCalledTimes(1);

      a.d.resolve();
      await flush();
      expect([...startLog].sort()).toEqual(['a', 'b', 'c']);
      expect(d.task.run).not.toHaveBeenCalled();

      b.d.resolve();
      await flush();
      expect(d.task.run).not.toHaveBeenCalled(); // c still pending

      c.d.resolve();
      await flush();
      expect(d.task.run).toHaveBeenCalledTimes(1);

      d.d.resolve();
      await expect(result).resolves.toEqual({
        a: 'fulfilled',
        b: 'fulfilled',
        c: 'fulfilled',
        d: 'fulfilled',
      });
      expect(a.task.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('failure handling', () => {
    it('marks a failing task rejected and resolves the runner anyway', async () => {
      const statuses = await runTaskGraph(
        [
          {
            id: 'bad',
            deps: [],
            run: () => Promise.reject(new Error('boom')),
          },
        ],
        1
      );
      expect(statuses).toEqual({ bad: 'rejected' });
    });

    it('skips direct and transitive dependents of a failed task', async () => {
      const startLog: string[] = [];
      const skippedRun = jest.fn(() => Promise.resolve());
      const statuses = await runTaskGraph(
        [
          {
            id: 'a',
            deps: [],
            run: () => Promise.reject(new Error('a failed')),
          },
          { id: 'b', deps: ['a'], run: skippedRun },
          { id: 'c', deps: ['b'], run: skippedRun },
          autoTask('other', [], startLog),
        ],
        2
      );
      expect(statuses).toEqual({
        a: 'rejected',
        b: 'skipped',
        c: 'skipped',
        other: 'fulfilled',
      });
      expect(skippedRun).not.toHaveBeenCalled();
    });

    it('lets independent branches continue after a failure', async () => {
      const startLog: string[] = [];
      const bad = makeTask('bad', [], startLog);
      const goodRoot = makeTask('goodRoot', [], startLog);
      const goodChild = makeTask('goodChild', ['goodRoot'], startLog);
      const doomed = makeTask('doomed', ['bad'], startLog);

      const result = runTaskGraph(
        [bad.task, goodRoot.task, goodChild.task, doomed.task],
        3
      );
      await flush();
      bad.d.reject(new Error('bad failed'));
      await flush();

      goodRoot.d.resolve();
      await flush();
      expect(startLog).toContain('goodChild'); // healthy branch kept going

      goodChild.d.resolve();
      await expect(result).resolves.toEqual({
        bad: 'rejected',
        goodRoot: 'fulfilled',
        goodChild: 'fulfilled',
        doomed: 'skipped',
      });
      expect(doomed.task.run).not.toHaveBeenCalled();
    });

    it('skips a diamond join when only one arm fails', async () => {
      const joinRun = jest.fn(() => Promise.resolve());
      const statuses = await runTaskGraph(
        [
          autoTask('a', []),
          {
            id: 'b',
            deps: ['a'],
            run: () => Promise.reject(new Error('arm b failed')),
          },
          autoTask('c', ['a']),
          { id: 'd', deps: ['b', 'c'], run: joinRun },
        ],
        4
      );
      expect(statuses).toEqual({
        a: 'fulfilled',
        b: 'rejected',
        c: 'fulfilled',
        d: 'skipped',
      });
      expect(joinRun).not.toHaveBeenCalled();
    });
  });

  describe('graph validation', () => {
    it('throws synchronously on a self-cycle without running anything', () => {
      const run = jest.fn(() => Promise.resolve());
      expect(() =>
        runTaskGraph([{ id: 'a', deps: ['a'], run }], 1)
      ).toThrow();
      expect(run).not.toHaveBeenCalled();
    });

    it('throws synchronously on a longer cycle', () => {
      const run = jest.fn(() => Promise.resolve());
      expect(() =>
        runTaskGraph(
          [
            { id: 'a', deps: ['c'], run },
            { id: 'b', deps: ['a'], run },
            { id: 'c', deps: ['b'], run },
          ],
          2
        )
      ).toThrow();
      expect(run).not.toHaveBeenCalled();
    });

    it('does not flag a diamond as a cycle', async () => {
      const statuses = await runTaskGraph(
        [
          autoTask('a', []),
          autoTask('b', ['a']),
          autoTask('c', ['a']),
          autoTask('d', ['b', 'c']),
        ],
        2
      );
      expect(Object.values(statuses)).toEqual([
        'fulfilled',
        'fulfilled',
        'fulfilled',
        'fulfilled',
      ]);
    });

    it('throws synchronously on an unknown dependency id', () => {
      const run = jest.fn(() => Promise.resolve());
      expect(() =>
        runTaskGraph([{ id: 'a', deps: ['ghost'], run }], 1)
      ).toThrow();
      expect(run).not.toHaveBeenCalled();
    });
  });

  describe('result map', () => {
    it('reports a status for every task id', async () => {
      const statuses = await runTaskGraph(
        [
          autoTask('a', []),
          {
            id: 'b',
            deps: [],
            run: () => Promise.reject(new Error('nope')),
          },
          { id: 'c', deps: ['b'], run: () => Promise.resolve() },
        ],
        2
      );
      expect(Object.keys(statuses).sort()).toEqual(['a', 'b', 'c']);
      expect(statuses.a).toBe('fulfilled');
      expect(statuses.b).toBe('rejected');
      expect(statuses.c).toBe('skipped');
    });
  });
});
