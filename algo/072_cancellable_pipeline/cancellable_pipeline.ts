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

export function runPipeline<TResult = unknown>(
  steps: ReadonlyArray<PipelineStep>,
  input: unknown,
  signal: AbortSignal,
): Promise<TResult> {
  // TODO: implement
  throw new Error('Not implemented');
}
