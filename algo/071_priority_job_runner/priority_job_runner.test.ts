import { PriorityJobRunner } from './priority_job_runner';

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

/** A controllable job that records when it starts. */
function makeJob(name: string, startLog: string[]) {
  const d = deferred<string>();
  const fn = jest.fn((): Promise<string> => {
    startLog.push(name);
    return d.promise;
  });
  return { fn, d };
}

describe('PriorityJobRunner', () => {
  describe('happy path', () => {
    it('runs a job and resolves with its value', async () => {
      const runner = new PriorityJobRunner(2);
      await expect(runner.run(() => Promise.resolve('done'), 1)).resolves.toBe(
        'done'
      );
    });

    it('starts jobs immediately while slots are free', async () => {
      const runner = new PriorityJobRunner(2);
      const startLog: string[] = [];
      const a = makeJob('a', startLog);
      const b = makeJob('b', startLog);

      const pa = runner.run(a.fn, 1);
      const pb = runner.run(b.fn, 100);
      await flush();
      expect(startLog).toEqual(['a', 'b']); // both started, no queueing

      a.d.resolve('va');
      b.d.resolve('vb');
      await expect(pa).resolves.toBe('va');
      await expect(pb).resolves.toBe('vb');
    });
  });

  describe('concurrency limit', () => {
    it('never exceeds k jobs in flight', async () => {
      const runner = new PriorityJobRunner(2);
      let active = 0;
      let maxActive = 0;
      const jobs = Array.from({ length: 6 }, (_, i) =>
        runner.run(async () => {
          active++;
          maxActive = Math.max(maxActive, active);
          await flush();
          active--;
          return i;
        }, 1)
      );
      await Promise.all(jobs);
      expect(maxActive).toBe(2);
    });

    it('does not invoke a queued job before a slot frees', async () => {
      const runner = new PriorityJobRunner(1);
      const startLog: string[] = [];
      const a = makeJob('a', startLog);
      const b = makeJob('b', startLog);

      const pa = runner.run(a.fn, 1);
      const pb = runner.run(b.fn, 1);
      await flush();
      expect(b.fn).not.toHaveBeenCalled();

      a.d.resolve('va');
      await flush();
      expect(startLog).toEqual(['a', 'b']);
      b.d.resolve('vb');
      await Promise.all([pa, pb]);
    });
  });

  describe('priority scheduling', () => {
    it('starts the highest-priority queued job when a slot frees', async () => {
      const runner = new PriorityJobRunner(1);
      const startLog: string[] = [];
      const filler = makeJob('filler', startLog);
      const low = makeJob('low', startLog);
      const high = makeJob('high', startLog);
      const mid = makeJob('mid', startLog);

      const pFiller = runner.run(filler.fn, 1);
      const pLow = runner.run(low.fn, 1);
      const pHigh = runner.run(high.fn, 10);
      const pMid = runner.run(mid.fn, 5);
      await flush();
      expect(startLog).toEqual(['filler']);

      filler.d.resolve('f');
      await flush();
      expect(startLog).toEqual(['filler', 'high']);

      high.d.resolve('h');
      await flush();
      expect(startLog).toEqual(['filler', 'high', 'mid']);

      mid.d.resolve('m');
      await flush();
      expect(startLog).toEqual(['filler', 'high', 'mid', 'low']);

      low.d.resolve('l');
      await expect(Promise.all([pFiller, pLow, pHigh, pMid])).resolves.toEqual(
        ['f', 'l', 'h', 'm']
      );
    });

    it('a high-priority job submitted later overtakes waiting low-priority jobs', async () => {
      const runner = new PriorityJobRunner(1);
      const startLog: string[] = [];
      const filler = makeJob('filler', startLog);
      const low1 = makeJob('low1', startLog);
      const low2 = makeJob('low2', startLog);

      const promises = [
        runner.run(filler.fn, 1),
        runner.run(low1.fn, 1),
        runner.run(low2.fn, 1),
      ];
      await flush();

      // arrives last, but with the highest priority
      const urgent = makeJob('urgent', startLog);
      promises.push(runner.run(urgent.fn, 99));

      filler.d.resolve('f');
      await flush();
      expect(startLog).toEqual(['filler', 'urgent']);

      urgent.d.resolve('u');
      await flush();
      low1.d.resolve('l1');
      await flush();
      low2.d.resolve('l2');
      await Promise.all(promises);
      expect(startLog).toEqual(['filler', 'urgent', 'low1', 'low2']);
    });

    it('keeps FIFO order among equal priorities', async () => {
      const runner = new PriorityJobRunner(1);
      const startLog: string[] = [];
      const filler = makeJob('filler', startLog);
      const a = makeJob('a', startLog);
      const b = makeJob('b', startLog);
      const c = makeJob('c', startLog);

      const promises = [
        runner.run(filler.fn, 1),
        runner.run(a.fn, 5),
        runner.run(b.fn, 5),
        runner.run(c.fn, 5),
      ];
      await flush();

      filler.d.resolve('f');
      await flush();
      a.d.resolve('va');
      await flush();
      b.d.resolve('vb');
      await flush();
      c.d.resolve('vc');
      await Promise.all(promises);
      expect(startLog).toEqual(['filler', 'a', 'b', 'c']);
    });
  });

  describe('rejection handling', () => {
    it('rejects the job promise with its own reason', async () => {
      const runner = new PriorityJobRunner(2);
      const boom = new Error('transcode failed');
      await expect(runner.run(() => Promise.reject(boom), 1)).rejects.toBe(
        boom
      );
    });

    it('frees the slot after a rejection so the next job starts', async () => {
      const runner = new PriorityJobRunner(1);
      const startLog: string[] = [];
      const bad = makeJob('bad', startLog);
      const next = makeJob('next', startLog);

      const pBad = runner.run(bad.fn, 1);
      const pNext = runner.run(next.fn, 1);
      await flush();
      expect(startLog).toEqual(['bad']);

      bad.d.reject(new Error('oom'));
      await expect(pBad).rejects.toThrow('oom');
      await flush();
      expect(startLog).toEqual(['bad', 'next']);

      next.d.resolve('ok');
      await expect(pNext).resolves.toBe('ok');
    });

    it('a rejection does not reject or drop other queued jobs', async () => {
      const runner = new PriorityJobRunner(1);
      const results = await Promise.allSettled([
        runner.run(() => Promise.reject(new Error('e1')), 5),
        runner.run(() => Promise.resolve('v2'), 1),
        runner.run(() => Promise.reject(new Error('e3')), 1),
        runner.run(() => Promise.resolve('v4'), 1),
      ]);
      expect(results.map((r) => r.status)).toEqual([
        'rejected',
        'fulfilled',
        'rejected',
        'fulfilled',
      ]);
    });
  });
});
