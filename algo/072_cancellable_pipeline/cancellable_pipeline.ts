export class AbortError extends Error {
  constructor(message = 'Pipeline aborted') {
    super(message);
    this.name = 'AbortError';
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

export interface PipelineStep<I = any, O = any> {
  /** Runs the step with the previous step's result and the shared signal. */
  run(input: I, signal: AbortSignal): Promise<O>;
  /** Optional teardown; runs once if (and only if) this step started. */
  cleanup?(): void | Promise<void>;
}

export async function runPipeline<TResult = unknown>(
  steps: ReadonlyArray<PipelineStep>,
  input: unknown,
  signal: AbortSignal,
): Promise<TResult> {
  if (signal.aborted) throw new AbortError();
  const cleanUps: Array<() => void | Promise<void>> = [];
  let removeAbortListener = () => {};

  const aborted = new Promise((_, reject) => {
    const onAbort = () => reject(new AbortError());
    signal.addEventListener('abort', onAbort, { once: true });
    removeAbortListener = () => signal.removeEventListener('abort', onAbort);
  });

  aborted.catch(() => {});

  try {
    let result: unknown = input;

    for (const step of steps) {
      if (signal.aborted) throw new AbortError();
      const stepPromise = step.run(result, signal);
      stepPromise.catch(() => {});
      if (step.cleanup) cleanUps.push(step.cleanup.bind(step));
      result = await Promise.race([stepPromise, aborted]);
    }

    return result as TResult;
  } finally {
    removeAbortListener();
    for (let i = cleanUps.length - 1; i >= 0; i--) {
      await cleanUps[i]();
    }
  }
}
