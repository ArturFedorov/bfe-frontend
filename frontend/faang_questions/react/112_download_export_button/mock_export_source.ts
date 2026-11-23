import { ExportApi, ExportStatus } from './export_types';

export interface MockExportSourceOptions {
  /** How many `waiting` answers each job gives before its terminal result. */
  waitingCount: number;
  url?: string;
  fileName?: string;
  /** When set, the terminal result is `failed` with this error instead of `success`. */
  failWith?: string;
  /** Simulated latency per call; 0 resolves without a timer. */
  delayMs?: number;
}

export interface MockExportSource extends ExportApi {
  getStatusCallCount(): number;
}

export function createMockExportSource({
  url = 'https://files.example.com/export.csv',
  waitingCount,
  fileName = 'export.csv',
  failWith,
  delayMs = 0,
}: MockExportSourceOptions): MockExportSource {
  if (!Number.isInteger(waitingCount) || waitingCount < 0) {
    throw new RangeError('waitingCount must be a positive integer');
  }

  const terminal: ExportStatus =
    failWith === undefined
      ? { status: 'success', url, fileName }
      : { status: 'failed', error: failWith };

  const polls = new Map<string, number>();
  let jobCount = 0;
  let statusCalls = 0;

  const settle = <T>(produce: () => T) => {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        try {
          resolve(produce());
        } catch (error) {
          reject(error);
        }
      };

      if (delayMs > 0) setTimeout(run, delayMs);
      else run();
    });
  };

  const startExport = () => {
    return settle(() => {
      jobCount += 1;
      const jobId = `job-${jobCount}`;
      polls.set(jobId, 0);
      return { jobId };
    });
  };

  const getStatus = (jobId: string) => {
    statusCalls += 1;
    return settle((): ExportStatus => {
      const answered = polls.get(jobId);
      if (answered === undefined) throw new Error(`Unknown job: ${jobId}`);

      polls.set(jobId, answered + 1);
      return answered < waitingCount ? { status: 'waiting' } : { ...terminal };
    });
  };

  const getStatusCallCount = () => statusCalls;

  return {
    startExport,
    getStatus,
    getStatusCallCount,
  };
}
