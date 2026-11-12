/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import { deferred, flush } from '../../shell/testing';
import {
  createQueryClient,
  hashKey,
  invalidateQueries,
  QueryClientProvider,
  setQueryData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from './query';

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function Reader<T>({
  queryKey,
  queryFn,
  staleTime,
  label = 'reader',
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;
  label?: string;
}) {
  const q = useQuery({ queryKey, queryFn, staleTime });
  return (
    <output data-testid={label}>
      {q.status}|{q.isFetching ? 'fetching' : 'idle'}|
      {q.data === undefined ? '-' : String(q.data)}|
      {q.error ? q.error.message : ''}
    </output>
  );
}

describe('02 — query client + useQuery', () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('hashKey is structural; useQueryClient throws outside the provider; a query goes loading → success', async () => {
    expect(hashKey(['campaigns', { page: 1, status: 'all' }])).toBe(
      hashKey(['campaigns', { status: 'all', page: 1 }]),
    );
    expect(hashKey(['campaigns', { page: 1 }])).not.toBe(
      hashKey(['campaigns', { page: 2 }]),
    );
    expect(hashKey(['a', 1])).not.toBe(hashKey(['a', '1']));
    expect(() => renderHook(() => useQueryClient())).toThrow();

    const client = createQueryClient();
    const d = deferred<string>();
    render(<Reader queryKey={['greeting']} queryFn={() => d.promise} />, {
      wrapper: wrapperFor(client),
    });
    expect(screen.getByTestId('reader')).toHaveTextContent(
      'loading|fetching|-',
    );

    await act(async () => {
      d.resolve('hello');
      await flush();
    });
    expect(screen.getByTestId('reader')).toHaveTextContent(
      'success|idle|hello',
    );
    expect(client.getQueryData(['greeting'])).toBe('hello');
    expect(client.getQueryState(['greeting'])).toMatchObject({
      status: 'success',
      isFetching: false,
      isInvalidated: false,
    });
    expect(client.getQueryState(['never'])).toBeUndefined();
  });

  it('stale-while-revalidate: a remount renders cached data immediately and refetches in the background', async () => {
    const client = createQueryClient();
    const first = deferred<string>();
    const second = deferred<string>();
    const queryFn = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { unmount } = render(<Reader queryKey={['k']} queryFn={queryFn} />, {
      wrapper: wrapperFor(client),
    });
    await act(async () => {
      first.resolve('v1');
      await flush();
    });
    unmount();

    render(<Reader queryKey={['k']} queryFn={queryFn} />, {
      wrapper: wrapperFor(client),
    });
    // cached value shows at once, while a refetch is in flight (staleTime 0)
    expect(screen.getByTestId('reader')).toHaveTextContent(
      'success|fetching|v1',
    );
    expect(queryFn).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve('v2');
      await flush();
    });
    expect(screen.getByTestId('reader')).toHaveTextContent('success|idle|v2');
  });

  it('dedupes in-flight requests: two observers of one key trigger a single queryFn call and both update', async () => {
    const client = createQueryClient();
    const d = deferred<number>();
    const queryFn = jest.fn(() => d.promise);
    render(
      <>
        <Reader label="a" queryKey={['n']} queryFn={queryFn} />
        <Reader label="b" queryKey={['n']} queryFn={queryFn} />
      </>,
      { wrapper: wrapperFor(client) },
    );
    expect(queryFn).toHaveBeenCalledTimes(1);
    await act(async () => {
      d.resolve(42);
      await flush();
    });
    expect(screen.getByTestId('a')).toHaveTextContent('success|idle|42');
    expect(screen.getByTestId('b')).toHaveTextContent('success|idle|42');
  });

  it('stale-response guard: a response for a key the component no longer observes is ignored', async () => {
    const client = createQueryClient();
    const slow = deferred<string>();
    const fast = deferred<string>();
    const fns: Record<string, () => Promise<string>> = {
      p1: () => slow.promise,
      p2: () => fast.promise,
    };

    function Switcher({ page }: { page: string }) {
      return <Reader queryKey={['list', page]} queryFn={fns[page]} />;
    }
    const { rerender } = render(<Switcher page="p1" />, {
      wrapper: wrapperFor(client),
    });
    rerender(<Switcher page="p2" />);
    expect(screen.getByTestId('reader')).toHaveTextContent(
      'loading|fetching|-',
    );

    await act(async () => {
      fast.resolve('page two');
      await flush();
    });
    expect(screen.getByTestId('reader')).toHaveTextContent(
      'success|idle|page two',
    );

    await act(async () => {
      slow.resolve('page one'); // lands later — must not overwrite what is shown
      await flush();
    });
    expect(screen.getByTestId('reader')).toHaveTextContent(
      'success|idle|page two',
    );
    // ...but the cache for the old key is still filled, so going back is instant
    expect(client.getQueryData(['list', 'p1'])).toBe('page one');
  });

  it('staleTime: fresh data is not refetched on mount; once stale it is', async () => {
    let now = 10_000;
    const client = createQueryClient({ now: () => now });
    const queryFn = jest.fn(async () => 'x');

    const r1 = render(
      <Reader queryKey={['s']} queryFn={queryFn} staleTime={5_000} />,
      { wrapper: wrapperFor(client) },
    );
    await act(async () => flush());
    r1.unmount();
    expect(queryFn).toHaveBeenCalledTimes(1);

    now += 4_999;
    const r2 = render(
      <Reader queryKey={['s']} queryFn={queryFn} staleTime={5_000} />,
      { wrapper: wrapperFor(client) },
    );
    expect(screen.getByTestId('reader')).toHaveTextContent('success|idle|x');
    expect(queryFn).toHaveBeenCalledTimes(1);
    r2.unmount();

    now += 1;
    render(<Reader queryKey={['s']} queryFn={queryFn} staleTime={5_000} />, {
      wrapper: wrapperFor(client),
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
    await act(async () => flush());
  });

  it('setQueryData notifies observers synchronously; invalidateQueries refetches mounted observers by prefix', async () => {
    const client = createQueryClient();
    const fnA = jest.fn(async () => 'a1');
    const fnB = jest.fn(async () => 'b1');
    render(
      <>
        <Reader
          label="a"
          queryKey={['campaigns', 1]}
          queryFn={fnA}
          staleTime={60_000}
        />
        <Reader
          label="b"
          queryKey={['templates']}
          queryFn={fnB}
          staleTime={60_000}
        />
      </>,
      { wrapper: wrapperFor(client) },
    );
    await act(async () => flush());
    expect(screen.getByTestId('a')).toHaveTextContent('success|idle|a1');

    act(() =>
      setQueryData<string>(client, ['campaigns', 1], (prev) => `${prev}!`),
    );
    expect(screen.getByTestId('a')).toHaveTextContent('success|idle|a1!');

    fnA.mockResolvedValueOnce('a2');
    await act(async () => {
      await invalidateQueries(client, ['campaigns']);
    });
    expect(fnA).toHaveBeenCalledTimes(2);
    expect(fnB).toHaveBeenCalledTimes(1); // different prefix untouched
    expect(screen.getByTestId('a')).toHaveTextContent('success|idle|a2');
    expect(client.getQueryState(['campaigns', 1])?.isInvalidated).toBe(false);

    // unmounted queries are only flagged, not fetched
    await act(async () => {
      await client.invalidateQueries(['templates']);
    });
    expect(fnB).toHaveBeenCalledTimes(2);
  });

  it('useMutation: optimistic write in onMutate, rollback in onError, status/error exposed', async () => {
    const client = createQueryClient();
    client.setQueryData(['count'], 1);
    const d = deferred<number>();

    const { result } = renderHook(
      () =>
        useMutation<number, number, { previous: number | undefined }>({
          mutationFn: () => d.promise,
          onMutate: (delta) => {
            const previous = client.getQueryData<number>(['count']);
            client.setQueryData<number>(
              ['count'],
              (prev) => (prev ?? 0) + delta,
            );
            return { previous };
          },
          onError: (_error, _vars, context) => {
            client.setQueryData(['count'], context?.previous);
          },
        }),
      { wrapper: wrapperFor(client) },
    );
    expect(result.current.status).toBe('idle');

    let done!: Promise<void>;
    act(() => {
      done = result.current.mutate(5);
    });
    expect(client.getQueryData(['count'])).toBe(6); // optimistic
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      d.reject(new Error('server said no'));
      await done;
    });
    expect(client.getQueryData(['count'])).toBe(1); // rolled back
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('server said no');

    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('an unmounted observer receives nothing: no state update, no console.error, and errors land in the cache', async () => {
    const client = createQueryClient();
    const d = deferred<string>();
    const { unmount } = render(
      <Reader queryKey={['late']} queryFn={() => d.promise} />,
      { wrapper: wrapperFor(client) },
    );
    unmount();
    await act(async () => {
      d.reject(new Error('nope'));
      await flush();
    });
    expect(errorSpy).not.toHaveBeenCalled();
    expect(client.getQueryState(['late'])).toMatchObject({
      status: 'error',
      isFetching: false,
    });
    expect(client.getQueryState(['late'])?.error?.message).toBe('nope');
  });
});
