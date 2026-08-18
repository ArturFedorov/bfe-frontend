export interface FulfilledJob<Out> {
  status: 'fulfilled';
  value: Out;
}

export interface RejectedJob {
  status: 'rejected';
  reason: unknown;
}

export type JobResult<Out> = FulfilledJob<Out> | RejectedJob;

export type JobWorker<In, Out> = (job: In, index: number) => Promise<Out> | Out;

export interface ProcessBatchOptions {
  /** Maximum number of workers in flight at any instant. Positive integer. */
  concurrency: number;
}

/**
 * Runs `worker` over every job with bounded concurrency.
 *
 * - At most `options.concurrency` workers are in flight at once; a slot is
 *   reused the moment a job settles (shared cursor, not chunked waves).
 * - Results are returned in input order, allSettled-shaped: one bad job
 *   never rejects the batch.
 * - Throws RangeError synchronously if `concurrency` is not a positive
 *   integer (caller bug, not a job failure).
 */
export function processBatch<In, Out>(
  jobs: readonly In[],
  worker: JobWorker<In, Out>,
  options: ProcessBatchOptions,
): Promise<JobResult<Out>[]> {
  // TODO: implement
  throw new Error('Not implemented');
}
