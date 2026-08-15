import {
  runPipeline,
  AbortError,
  PipelineStep,
} from './cancellable_pipeline';

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

/** A controllable step that records starts, inputs, signals, and cleanups. */
function makeStep(name: string, log: string[]) {
  const d = deferred<unknown>();
  const inputs: unknown[] = [];
  const signals: AbortSignal[] = [];
  const step: PipelineStep = {
    run: jest.fn((input: unknown, signal: AbortSignal) => {
      log.push(`start:${name}`);
      inputs.push(input);
      signals.push(signal);
      return d.promise;
    }),
    cleanup: jest.fn(() => {
      log.push(`cleanup:${name}`);
    }),
  };
  return { step, d, inputs, signals };
}

describe('runPipeline', () => {
  describe('happy path', () => {
    it('runs steps in sequence and resolves with the final result', async () => {
      const signal = new AbortController().signal;
      const steps: PipelineStep[] = [
        { run: async (n: number) => n + 1 },
        { run: async (n: number) => n * 10 },
        { run: async (n: number) => `result:${n}` },
      ];
      await expect(runPipeline<string>(steps, 4, signal)).resolves.toBe(
        'result:50'
      );
    });

    it('feeds each step the previous step result and step 0 the input', async () => {
      const signal = new AbortController().signal;
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);

      const p = runPipeline([s1.step, s2.step], 'initial', signal);
      await flush();
      expect(s1.inputs).toEqual(['initial']);

      s1.d.resolve('from-one');
      await flush();
      expect(s2.inputs).toEqual(['from-one']);

      s2.d.resolve('from-two');
      await expect(p).resolves.toBe('from-two');
    });

    it('passes the same signal to every step', async () => {
      const controller = new AbortController();
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);

      const p = runPipeline([s1.step, s2.step], null, controller.signal);
      await flush();
      s1.d.resolve('a');
      await flush();
      s2.d.resolve('b');
      await p;

      expect(s1.signals[0]).toBe(controller.signal);
      expect(s2.signals[0]).toBe(controller.signal);
    });

    it('does not start a step before the previous one settles', async () => {
      const signal = new AbortController().signal;
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);

      const p = runPipeline([s1.step, s2.step], 0, signal);
      await flush();
      expect(s2.step.run).not.toHaveBeenCalled();

      s1.d.resolve(1);
      await flush();
      expect(s2.step.run).toHaveBeenCalledTimes(1);
      s2.d.resolve(2);
      await p;
    });

    it('resolves with the input when steps is empty', async () => {
      const signal = new AbortController().signal;
      await expect(runPipeline([], 'unchanged', signal)).resolves.toBe(
        'unchanged'
      );
    });
  });

  describe('abort behavior', () => {
    it('rejects with AbortError and skips the remaining steps', async () => {
      const controller = new AbortController();
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);
      const s3 = makeStep('three', log);

      const p = runPipeline(
        [s1.step, s2.step, s3.step],
        0,
        controller.signal
      );
      await flush();
      s1.d.resolve(1);
      await flush();
      expect(s2.step.run).toHaveBeenCalledTimes(1);

      controller.abort();
      await expect(p).rejects.toBeInstanceOf(AbortError);
      expect(s3.step.run).not.toHaveBeenCalled();
    });

    it('rejects even if the current step never settles', async () => {
      const controller = new AbortController();
      const log: string[] = [];
      const hung = makeStep('hung', log);

      const p = runPipeline([hung.step], 0, controller.signal);
      await flush();
      controller.abort();
      // hung.d is never resolved — abort alone must reject the pipeline
      await expect(p).rejects.toBeInstanceOf(AbortError);
    });

    it('rejects immediately without starting anything when the signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      const log: string[] = [];
      const s1 = makeStep('one', log);

      await expect(
        runPipeline([s1.step], 0, controller.signal)
      ).rejects.toBeInstanceOf(AbortError);
      expect(s1.step.run).not.toHaveBeenCalled();
      expect(s1.step.cleanup).not.toHaveBeenCalled();
    });
  });

  describe('cleanup guarantees', () => {
    it('runs cleanup for every started step, in reverse order, on abort', async () => {
      const controller = new AbortController();
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);
      const s3 = makeStep('three', log);

      const p = runPipeline(
        [s1.step, s2.step, s3.step],
        0,
        controller.signal
      );
      await flush();
      s1.d.resolve(1);
      await flush();
      controller.abort();
      await expect(p).rejects.toBeInstanceOf(AbortError);

      expect(s1.step.cleanup).toHaveBeenCalledTimes(1);
      expect(s2.step.cleanup).toHaveBeenCalledTimes(1);
      expect(s3.step.cleanup).not.toHaveBeenCalled();
      const cleanups = log.filter((l) => l.startsWith('cleanup:'));
      expect(cleanups).toEqual(['cleanup:two', 'cleanup:one']);
    });

    it('runs every cleanup exactly once, in reverse order, on success', async () => {
      const signal = new AbortController().signal;
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);

      const p = runPipeline([s1.step, s2.step], 0, signal);
      await flush();
      s1.d.resolve(1);
      await flush();
      s2.d.resolve('final');
      await expect(p).resolves.toBe('final');

      expect(s1.step.cleanup).toHaveBeenCalledTimes(1);
      expect(s2.step.cleanup).toHaveBeenCalledTimes(1);
      const cleanups = log.filter((l) => l.startsWith('cleanup:'));
      expect(cleanups).toEqual(['cleanup:two', 'cleanup:one']);
    });

    it('runs cleanups when a step rejects', async () => {
      const signal = new AbortController().signal;
      const log: string[] = [];
      const s1 = makeStep('one', log);
      const s2 = makeStep('two', log);
      const s3 = makeStep('three', log);

      const p = runPipeline(
        [s1.step, s2.step, s3.step],
        0,
        signal
      );
      await flush();
      s1.d.resolve(1);
      await flush();
      s2.d.reject(new Error('transcode crashed'));
      await expect(p).rejects.toThrow('transcode crashed');

      expect(s1.step.cleanup).toHaveBeenCalledTimes(1);
      expect(s2.step.cleanup).toHaveBeenCalledTimes(1);
      expect(s3.step.run).not.toHaveBeenCalled();
      expect(s3.step.cleanup).not.toHaveBeenCalled();
    });

    it('tolerates steps without a cleanup callback', async () => {
      const signal = new AbortController().signal;
      const steps: PipelineStep[] = [
        { run: async (n: number) => n + 1 },
        { run: async (n: number) => n + 2 },
      ];
      await expect(runPipeline(steps, 0, signal)).resolves.toBe(3);
    });

    it('waits for async cleanups before settling', async () => {
      const controller = new AbortController();
      const cleanupGate = deferred<void>();
      let cleanupFinished = false;
      const steps: PipelineStep[] = [
        {
          run: () => new Promise(() => {}), // hangs until abort
          cleanup: async () => {
            await cleanupGate.promise;
            cleanupFinished = true;
          },
        },
      ];

      const p = runPipeline(steps, 0, controller.signal);
      await flush();
      controller.abort();

      let settled = false;
      p.catch(() => {
        settled = true;
      });
      await flush();
      expect(settled).toBe(false); // still waiting on cleanup

      cleanupGate.resolve();
      await expect(p).rejects.toBeInstanceOf(AbortError);
      expect(cleanupFinished).toBe(true);
    });
  });

  describe('error propagation', () => {
    it('propagates the original step error unchanged', async () => {
      const signal = new AbortController().signal;
      const boom = new Error('download failed');
      const steps: PipelineStep[] = [{ run: () => Promise.reject(boom) }];
      await expect(runPipeline(steps, 0, signal)).rejects.toBe(boom);
    });

    it('AbortError is an Error with name AbortError', () => {
      const err = new AbortError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AbortError);
      expect(err.name).toBe('AbortError');
    });
  });
});
