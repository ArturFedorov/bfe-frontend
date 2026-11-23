import { ExportStatus } from './export_types';
import {
  MockExportSource,
  MockExportSourceOptions,
} from './mock_export_source';

export function createMockExportSource({
  waitingCount,
  url = 'https://files.example.com/export.csv',
  fileName = 'export.csv',
  failWith,
  delayMs = 0,
}: MockExportSourceOptions): MockExportSource {
  if (!Number.isInteger(waitingCount) || waitingCount < 0) {
    throw new RangeError('waitingCount must be a non-negative integer');
  }

  const terminal: ExportStatus =
    failWith === undefined
      ? { status: 'success', url, fileName }
      : { status: 'failed', error: failWith };

  // jobId -> polls answered so far
  const polls = new Map<string, number>();
  let jobCount = 0;
  let statusCalls = 0;

  const settle = <T>(produce: () => T): Promise<T> =>
    new Promise<T>((resolve, reject) => {
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

  return {
    startExport() {
      return settle(() => {
        jobCount += 1;
        const jobId = `job-${jobCount}`;
        polls.set(jobId, 0);
        return { jobId };
      });
    },

    getStatus(jobId) {
      statusCalls += 1;
      return settle((): ExportStatus => {
        const answered = polls.get(jobId);
        if (answered === undefined) throw new Error(`Unknown job: ${jobId}`);

        polls.set(jobId, answered + 1);
        return answered < waitingCount
          ? { status: 'waiting' }
          : { ...terminal };
      });
    },

    getStatusCallCount() {
      return statusCalls;
    },
  };
}
