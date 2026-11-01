/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useFetch } from './use_fetch';

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

function jsonResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as unknown as Response;
}

describe('useFetch', () => {
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function signalOfCall(index: number): AbortSignal {
    const init = fetchMock.mock.calls[index][1];
    return (init as RequestInit).signal as AbortSignal;
  }

  it('starts loading, then exposes parsed JSON on success', async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValueOnce(d.promise);

    const { result } = renderHook(() => useFetch<{ name: string }>('/api/partners/1'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/partners/1', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      d.resolve(jsonResponse({ name: 'Warner' }));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ name: 'Warner' });
    expect(result.current.error).toBeNull();
  });

  it('surfaces a non-ok response as an error', async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValueOnce(d.promise);

    const { result } = renderHook(() => useFetch('/api/partners/404'));

    await act(async () => {
      d.resolve(jsonResponse(null, false, 500));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('500');
  });

  it('surfaces a rejected fetch as an error', async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValueOnce(d.promise);

    const { result } = renderHook(() => useFetch('/api/partners/1'));

    await act(async () => {
      d.reject(new Error('network down'));
    });

    expect(result.current.error?.message).toBe('network down');
    expect(result.current.loading).toBe(false);
  });

  it('aborts the in-flight request when the url changes and ignores its stale settlement', async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(({ url }) => useFetch<{ id: string }>(url), {
      initialProps: { url: '/api/partners/a' },
    });

    expect(signalOfCall(0).aborted).toBe(false);

    rerender({ url: '/api/partners/b' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(signalOfCall(0).aborted).toBe(true);
    expect(signalOfCall(1).aborted).toBe(false);

    // the stale response settles late — it must not win
    await act(async () => {
      first.resolve(jsonResponse({ id: 'a' }));
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => {
      second.resolve(jsonResponse({ id: 'b' }));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ id: 'b' });
  });

  it('aborts the in-flight request on unmount and ignores its settlement', async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValueOnce(d.promise);

    const { unmount } = renderHook(() => useFetch('/api/partners/1'));

    unmount();
    expect(signalOfCall(0).aborted).toBe(true);

    // settling after unmount must not throw or update state
    await act(async () => {
      d.resolve(jsonResponse({ name: 'late' }));
    });
  });

  it('refetch() re-runs the request for the current url', async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useFetch<{ v: number }>('/api/status'));

    await act(async () => {
      first.resolve(jsonResponse({ v: 1 }));
    });
    expect(result.current.data).toEqual({ v: 1 });

    act(() => result.current.refetch());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/status', expect.anything());
    expect(result.current.loading).toBe(true);

    await act(async () => {
      second.resolve(jsonResponse({ v: 2 }));
    });
    expect(result.current.data).toEqual({ v: 2 });
    expect(result.current.loading).toBe(false);
  });

  it('keeps a stable refetch identity across renders', async () => {
    const d = deferred<Response>();
    fetchMock.mockReturnValue(d.promise);

    const { result, rerender } = renderHook(() => useFetch('/api/status'));
    const refetch = result.current.refetch;

    rerender();
    await act(async () => {
      d.resolve(jsonResponse({}));
    });

    expect(result.current.refetch).toBe(refetch);
  });
});
