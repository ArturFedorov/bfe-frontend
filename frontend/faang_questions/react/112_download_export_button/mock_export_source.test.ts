import { createMockExportSource } from './mock_export_source';

describe('createMockExportSource', () => {
  it('returns waiting exactly waitingCount times, then success', async () => {
    const source = createMockExportSource({
      waitingCount: 2,
      url: '/files/q3.csv',
      fileName: 'q3.csv',
    });
    const { jobId } = await source.startExport();

    expect(jobId).toBe('job-1');
    expect(await source.getStatus(jobId)).toEqual({ status: 'waiting' });
    expect(await source.getStatus(jobId)).toEqual({ status: 'waiting' });
    expect(await source.getStatus(jobId)).toEqual({
      status: 'success',
      url: '/files/q3.csv',
      fileName: 'q3.csv',
    });
  });

  it('keeps returning the terminal result after it is reached', async () => {
    const source = createMockExportSource({ waitingCount: 1 });
    const { jobId } = await source.startExport();

    await source.getStatus(jobId);
    const first = await source.getStatus(jobId);
    const second = await source.getStatus(jobId);

    expect(first).toEqual({
      status: 'success',
      url: 'https://files.example.com/export.csv',
      fileName: 'export.csv',
    });
    expect(second).toEqual(first);
  });

  it('returns the terminal result on the first poll when waitingCount is 0', async () => {
    const source = createMockExportSource({ waitingCount: 0 });
    const { jobId } = await source.startExport();

    expect((await source.getStatus(jobId)).status).toBe('success');
  });

  it('returns failed with the given error when failWith is set', async () => {
    const source = createMockExportSource({
      waitingCount: 1,
      failWith: 'disk full',
    });
    const { jobId } = await source.startExport();

    expect(await source.getStatus(jobId)).toEqual({ status: 'waiting' });
    expect(await source.getStatus(jobId)).toEqual({
      status: 'failed',
      error: 'disk full',
    });
  });

  it('numbers jobs in start order and counts polls per job', async () => {
    const source = createMockExportSource({ waitingCount: 1 });
    const a = await source.startExport();
    const b = await source.startExport();

    expect(a.jobId).toBe('job-1');
    expect(b.jobId).toBe('job-2');

    expect((await source.getStatus(a.jobId)).status).toBe('waiting');
    expect((await source.getStatus(a.jobId)).status).toBe('success');
    // job-2 has not been polled yet, so it starts from waiting
    expect((await source.getStatus(b.jobId)).status).toBe('waiting');
  });

  it('rejects for an unknown job id', async () => {
    const source = createMockExportSource({ waitingCount: 1 });

    await expect(source.getStatus('job-99')).rejects.toThrow(
      'Unknown job: job-99',
    );
  });

  it('counts every getStatus call across jobs, including rejected ones', async () => {
    const source = createMockExportSource({ waitingCount: 3 });
    const a = await source.startExport();
    const b = await source.startExport();

    await source.getStatus(a.jobId);
    await source.getStatus(b.jobId);
    await source.getStatus(a.jobId);
    await source.getStatus('nope').catch(() => undefined);

    expect(source.getStatusCallCount()).toBe(4);
  });

  it.each([-1, 1.5, NaN])(
    'throws RangeError for waitingCount %p',
    (waitingCount) => {
      expect(() => createMockExportSource({ waitingCount })).toThrow(
        RangeError,
      );
    },
  );

  describe('delayMs', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('settles each call only after delayMs', async () => {
      const source = createMockExportSource({ waitingCount: 1, delayMs: 500 });
      const onStart = jest.fn();

      source.startExport().then(onStart);
      await Promise.resolve();
      expect(onStart).not.toHaveBeenCalled();

      jest.advanceTimersByTime(499);
      await Promise.resolve();
      expect(onStart).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      await Promise.resolve();
      expect(onStart).toHaveBeenCalledWith({ jobId: 'job-1' });

      const onStatus = jest.fn();
      source.getStatus('job-1').then(onStatus);
      await Promise.resolve();
      expect(onStatus).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      await Promise.resolve();
      expect(onStatus).toHaveBeenCalledWith({ status: 'waiting' });
    });

    it('resolves without any timer when delayMs is 0', async () => {
      const source = createMockExportSource({ waitingCount: 0 });

      const pending = source.startExport();
      expect(jest.getTimerCount()).toBe(0);
      await expect(pending).resolves.toEqual({ jobId: 'job-1' });
    });
  });
});
