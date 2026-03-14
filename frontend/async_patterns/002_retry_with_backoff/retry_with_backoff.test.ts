import { retry } from './retry_with_backoff';

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should succeed on first try without delay', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const promise = retry(fn, { retries: 3, initialDelay: 100 });
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should succeed after a retry', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const promise = retry(fn, { retries: 3, initialDelay: 100 });

    await jest.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should reject after all retries fail', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    const promise = retry(fn, { retries: 2, initialDelay: 100 });

    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);

    await expect(promise).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential delay with default factor of 2', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    const promise = retry(fn, { retries: 3, initialDelay: 100 });

    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(400);
    expect(fn).toHaveBeenCalledTimes(4);

    await expect(promise).rejects.toThrow('fail');
  });

  it('should use custom factor', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    const promise = retry(fn, { retries: 2, initialDelay: 100, factor: 3 });

    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(300);
    expect(fn).toHaveBeenCalledTimes(3);

    await expect(promise).rejects.toThrow('fail');
  });

  it('should reject immediately with zero retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    const promise = retry(fn, { retries: 0, initialDelay: 100 });

    await expect(promise).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
