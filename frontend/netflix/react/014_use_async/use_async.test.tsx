/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useAsync } from './use_async';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsync', () => {
  it('starts idle with no data and no error', () => {
    const { result } = renderHook(() => useAsync(async () => 'ok'));

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('run() moves through loading to success with the resolved data', async () => {
    const d = deferred<string>();
    const fn = jest.fn(() => d.promise);
    const { result } = renderHook(() => useAsync(fn));

    act(() => {
      void result.current.run();
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      d.resolve('sync triggered');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('sync triggered');
    expect(result.current.error).toBeNull();
  });

  it('run() moves to error on rejection without throwing to the caller', async () => {
    const d = deferred<string>();
    const { result } = renderHook(() => useAsync(() => d.promise));

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.run();
    });

    await act(async () => {
      d.reject(new Error('credentials rejected'));
    });
    await expect(runPromise).resolves.toBeUndefined();

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('credentials rejected');
    expect(result.current.data).toBeNull();
  });

  it('forwards run() arguments to fn', async () => {
    const fn = jest.fn(async (id: string, force: boolean) => `${id}:${force}`);
    const { result } = renderHook(() => useAsync(fn));

    await act(async () => {
      await result.current.run('partner-7', true);
    });

    expect(fn).toHaveBeenCalledWith('partner-7', true);
    expect(result.current.data).toBe('partner-7:true');
  });

  it('ignores a stale resolution settling after a newer run() started', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const fn = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useAsync(fn));

    act(() => {
      void result.current.run();
    });
    act(() => {
      void result.current.run();
    });

    // the older run settles late — it lost the race and must be discarded
    await act(async () => {
      first.resolve('stale result');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.data).toBeNull();

    await act(async () => {
      second.resolve('fresh result');
    });
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('fresh result');
  });

  it('ignores a stale rejection settling after a newer run() started', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const fn = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useAsync(fn));

    act(() => {
      void result.current.run();
    });
    act(() => {
      void result.current.run();
    });

    await act(async () => {
      first.reject(new Error('stale failure'));
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.error).toBeNull();

    await act(async () => {
      second.resolve('fresh result');
    });
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('fresh result');
    expect(result.current.error).toBeNull();
  });

  it('keeps a stable run identity and uses the latest fn', async () => {
    const oldFn = jest.fn(async () => 'old');
    const newFn = jest.fn(async () => 'new');
    const { result, rerender } = renderHook(({ fn }) => useAsync(fn), {
      initialProps: { fn: oldFn },
    });
    const run = result.current.run;

    rerender({ fn: newFn });
    expect(result.current.run).toBe(run);

    await act(async () => {
      await result.current.run();
    });

    expect(oldFn).not.toHaveBeenCalled();
    expect(newFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('new');
  });
});
