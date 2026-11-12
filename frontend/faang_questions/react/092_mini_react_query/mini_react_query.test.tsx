/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, useState } from 'react';
import { deferred, Deferred, flush } from '../_helpers/deferred';
import {
  createQueryClient,
  hashQueryKey,
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from './mini_react_query';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'approved';
}

const DRAFTS: Campaign[] = [
  { id: 'c1', name: 'Spring sale', status: 'draft' },
  { id: 'c2', name: 'Win-back push', status: 'draft' },
];

/** queryFn whose every call is a deferred the test resolves by hand; also counts calls. */
function createSource<T>() {
  const calls: Deferred<T>[] = [];
  const queryFn = jest.fn((): Promise<T> => {
    const d = deferred<T>();
    calls.push(d);
    return d.promise;
  });
  return { calls, queryFn };
}

interface ListProps {
  status: 'draft' | 'approved';
  queryFn: () => Promise<Campaign[]>;
  staleTime?: number;
  enabled?: boolean;
  onRender?: (id: string) => void;
  /** Alternate key spelling for the dedupe test — same meaning, different object key order. */
  keyVariant?: 'a' | 'b';
}

function CampaignList({ status, queryFn, staleTime, enabled, onRender, keyVariant = 'a' }: ListProps) {
  onRender?.(`list-${status}-${keyVariant}`);
  const queryKey =
    keyVariant === 'a' ? ['campaigns', { status, channel: 'email' }] : ['campaigns', { channel: 'email', status }];
  const q = useQuery<Campaign[]>({ queryKey, queryFn, staleTime, enabled });
  return (
    <section aria-label={`Campaigns ${status} ${keyVariant}`}>
      <div role="status">
        {q.status}
        {q.isFetching ? ' fetching' : ''}
      </div>
      {q.error && <div role="alert">{q.error.message}</div>}
      <ul>
        {q.data?.map((c) => (
          <li key={c.id}>
            {c.name} · {c.status}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => void q.refetch()}>
        Refetch
      </button>
    </section>
  );
}

const KEY_DRAFT = ['campaigns', { status: 'draft', channel: 'email' }];

function withClient(client: QueryClient, ui: ReactNode) {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

const section = (status: string, variant = 'a') => screen.getByRole('region', { name: `Campaigns ${status} ${variant}` });
const statusOf = (status: string, variant = 'a') => within(section(status, variant)).getByRole('status');
const itemsOf = (status: string, variant = 'a') =>
  within(section(status, variant))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

async function settle(fn: () => void = () => {}) {
  await act(async () => {
    fn();
    await flush();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('hashQueryKey', () => {
  it('is order-sensitive for arrays and order-insensitive for object keys', () => {
    expect(hashQueryKey(['campaigns', { status: 'draft', channel: 'email' }])).toBe(
      hashQueryKey(['campaigns', { channel: 'email', status: 'draft' }]),
    );
    expect(hashQueryKey(['campaigns', 'draft'])).not.toBe(hashQueryKey(['draft', 'campaigns']));
    expect(hashQueryKey(['campaigns', { id: 1 }])).not.toBe(hashQueryKey(['campaigns', { id: '1' }]));
    expect(hashQueryKey(['campaigns', { nested: { b: 1, a: 2 } }])).toBe(
      hashQueryKey(['campaigns', { nested: { a: 2, b: 1 } }]),
    );
  });
});

describe('useQuery — fetching and status', () => {
  it('reports loading, calls queryFn once, then success with the data', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} />));

    expect(statusOf('draft')).toHaveTextContent(/^loading fetching$/);
    expect(itemsOf('draft')).toEqual([]);
    await settle();
    expect(queryFn).toHaveBeenCalledTimes(1);

    await settle(() => calls[0].resolve(DRAFTS));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(client.getQueryData<Campaign[]>(KEY_DRAFT)).toEqual(DRAFTS);
  });

  it('enabled: false renders status idle and never calls queryFn until enabled', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    function Gate() {
      const [enabled, setEnabled] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setEnabled(true)}>
            Enable
          </button>
          <CampaignList status="draft" queryFn={queryFn} enabled={enabled} />
        </>
      );
    }
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(withClient(client, <Gate />));
    await settle();
    expect(statusOf('draft')).toHaveTextContent(/^idle$/);
    expect(queryFn).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Enable' }));
    await settle();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(statusOf('draft')).toHaveTextContent(/^loading fetching$/);
    await settle(() => calls[0].resolve(DRAFTS));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
  });

  it('a failed fetch sets status error with the Error and keeps the previous data', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} />));
    await settle(() => calls[0].resolve(DRAFTS));

    await user.click(screen.getByRole('button', { name: 'Refetch' }));
    expect(statusOf('draft')).toHaveTextContent(/^success fetching$/);
    await settle(() => calls[1].reject(new Error('503 from campaigns service')));

    expect(statusOf('draft')).toHaveTextContent(/^error$/);
    expect(within(section('draft')).getByRole('alert')).toHaveTextContent('503 from campaigns service');
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(client.getQueryData<Campaign[]>(KEY_DRAFT)).toEqual(DRAFTS);
  });
});

describe('useQuery — dedupe across observers', () => {
  it('two mounted components with the same key (different object key order) share one fetch and one cache entry', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    render(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={queryFn} keyVariant="a" />
          <CampaignList status="draft" queryFn={queryFn} keyVariant="b" />
        </>,
      ),
    );
    await settle();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(statusOf('draft', 'a')).toHaveTextContent(/^loading fetching$/);
    expect(statusOf('draft', 'b')).toHaveTextContent(/^loading fetching$/);

    await settle(() => calls[0].resolve(DRAFTS));
    expect(itemsOf('draft', 'a')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(itemsOf('draft', 'b')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});

describe('useQuery — staleTime and stale-while-revalidate', () => {
  it('remounting within staleTime shows cached data as success without a new fetch', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    const { unmount } = render(withClient(client, <CampaignList status="draft" queryFn={queryFn} staleTime={60_000} />));
    await settle(() => calls[0].resolve(DRAFTS));
    unmount();

    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} staleTime={60_000} />));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    await settle();
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('remounting after staleTime shows cached data instantly, refetches in the background (isFetching), then updates', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    const { unmount } = render(withClient(client, <CampaignList status="draft" queryFn={queryFn} staleTime={5_000} />));
    await settle(() => calls[0].resolve(DRAFTS));
    unmount();

    act(() => {
      jest.advanceTimersByTime(5_001);
    });
    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} staleTime={5_000} />));
    // cached data is on screen before any promise resolves
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(statusOf('draft')).toHaveTextContent(/^success/);
    await settle();
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(statusOf('draft')).toHaveTextContent(/^success fetching$/);
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);

    await settle(() => calls[1].resolve([{ id: 'c3', name: 'Launch email', status: 'draft' }]));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
    expect(itemsOf('draft')).toEqual(['Launch email · draft']);
  });
});

describe('invalidateQueries', () => {
  it('refetches matching entries with mounted observers and only marks unobserved ones stale', async () => {
    const client = createQueryClient();
    const drafts = createSource<Campaign[]>();
    const approved = createSource<Campaign[]>();
    const other = createSource<string[]>();
    function Audiences() {
      useQuery<string[]>({ queryKey: ['audiences'], queryFn: other.queryFn, staleTime: 60_000 });
      return null;
    }
    const { rerender } = render(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={drafts.queryFn} staleTime={60_000} />
          <CampaignList status="approved" queryFn={approved.queryFn} staleTime={60_000} />
          <Audiences />
        </>,
      ),
    );
    await settle(() => {
      drafts.calls[0].resolve(DRAFTS);
      approved.calls[0].resolve([]);
      other.calls[0].resolve(['vip']);
    });

    // approved list unmounts; its entry stays in the cache
    rerender(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={drafts.queryFn} staleTime={60_000} />
          <Audiences />
        </>,
      ),
    );

    await settle(() => void client.invalidateQueries(['campaigns']));
    expect(drafts.queryFn).toHaveBeenCalledTimes(2);
    expect(approved.queryFn).toHaveBeenCalledTimes(1);
    expect(other.queryFn).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(['campaigns', { status: 'approved', channel: 'email' }])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['audiences'])?.isInvalidated).toBeFalsy();
    expect(statusOf('draft')).toHaveTextContent(/^success fetching$/);
    await settle(() => drafts.calls[1].resolve(DRAFTS));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);

    // the stale (unobserved) approved entry refetches on its next mount even though staleTime has not passed
    rerender(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={drafts.queryFn} staleTime={60_000} />
          <CampaignList status="approved" queryFn={approved.queryFn} staleTime={60_000} />
          <Audiences />
        </>,
      ),
    );
    await settle();
    expect(approved.queryFn).toHaveBeenCalledTimes(2);
  });

  it('a late response from a request superseded by invalidation never overwrites the newer result (request counter)', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} />));
    await settle();
    expect(calls).toHaveLength(1);

    await settle(() => void client.invalidateQueries(['campaigns']));
    expect(calls).toHaveLength(2);

    // the newer request answers first
    await settle(() => calls[1].resolve([{ id: 'c9', name: 'Newest list', status: 'draft' }]));
    expect(itemsOf('draft')).toEqual(['Newest list · draft']);
    expect(statusOf('draft')).toHaveTextContent(/^success$/);

    // then the superseded one wakes up late
    await settle(() => calls[0].resolve([{ id: 'c0', name: 'Stale list', status: 'draft' }]));
    expect(itemsOf('draft')).toEqual(['Newest list · draft']);
    expect(client.getQueryData<Campaign[]>(KEY_DRAFT)?.[0].name).toBe('Newest list');
  });

  it('a superseded request resolving first is dropped: still fetching until the newest request settles', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} />));
    await settle();
    await settle(() => void client.invalidateQueries(['campaigns']));
    expect(calls).toHaveLength(2);

    await settle(() => calls[0].resolve([{ id: 'c0', name: 'Stale list', status: 'draft' }]));
    expect(itemsOf('draft')).toEqual([]);
    expect(statusOf('draft')).toHaveTextContent(/fetching$/);

    await settle(() => calls[1].resolve(DRAFTS));
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
  });
});

describe('setQueryData', () => {
  it('updates every observer of the key synchronously and leaves observers of other keys alone', async () => {
    const client = createQueryClient();
    const drafts = createSource<Campaign[]>();
    const approved = createSource<Campaign[]>();
    const renders: string[] = [];
    const onRender = (id: string) => renders.push(id);
    render(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={drafts.queryFn} onRender={onRender} keyVariant="a" />
          <CampaignList status="draft" queryFn={drafts.queryFn} onRender={onRender} keyVariant="b" />
          <CampaignList status="approved" queryFn={approved.queryFn} onRender={onRender} />
        </>,
      ),
    );
    await settle(() => {
      drafts.calls[0].resolve(DRAFTS);
      approved.calls[0].resolve([]);
    });
    renders.length = 0;

    act(() => {
      client.setQueryData<Campaign[]>(KEY_DRAFT, (old) => [
        ...(old ?? []),
        { id: 'c3', name: 'Added locally', status: 'draft' },
      ]);
    });

    expect(itemsOf('draft', 'a')).toEqual(['Spring sale · draft', 'Win-back push · draft', 'Added locally · draft']);
    expect(itemsOf('draft', 'b')).toEqual(['Spring sale · draft', 'Win-back push · draft', 'Added locally · draft']);
    expect(renders.filter((r) => r.startsWith('list-draft'))).toHaveLength(2);
    expect(renders.filter((r) => r.startsWith('list-approved'))).toHaveLength(0);
    expect(drafts.queryFn).toHaveBeenCalledTimes(1);
  });
});

describe('unmount', () => {
  it('an unmounted observer receives nothing, the entry stays cached, and a remount within staleTime does not refetch', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    const { unmount } = render(withClient(client, <CampaignList status="draft" queryFn={queryFn} staleTime={60_000} />));
    await settle();
    unmount();

    await settle(() => calls[0].resolve(DRAFTS));
    expect(client.getQueryData<Campaign[]>(KEY_DRAFT)).toEqual(DRAFTS);

    render(withClient(client, <CampaignList status="draft" queryFn={queryFn} staleTime={60_000} />));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    await settle();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('useMutation', () => {
  type ApproveContext = { previous: Campaign[] | undefined };

  function ApproveButton({ approve }: { approve: (id: string) => Promise<Campaign> }) {
    const client = useQueryClient();
    const m = useMutation<string, Campaign, ApproveContext>({
      mutationFn: approve,
      onMutate: (id) => {
        const previous = client.getQueryData<Campaign[]>(KEY_DRAFT);
        client.setQueryData<Campaign[]>(KEY_DRAFT, (old) =>
          (old ?? []).map((c) => (c.id === id ? { ...c, status: 'approved' } : c)),
        );
        return { previous };
      },
      onError: (_error, _id, context) => {
        client.setQueryData<Campaign[]>(KEY_DRAFT, context?.previous ?? []);
      },
      onSettled: () => {
        void client.invalidateQueries(['campaigns']);
      },
    });
    return (
      <div aria-label="Approval">
        <button type="button" onClick={() => void m.mutate('c1')}>
          Approve Spring sale
        </button>
        <div role="status">mutation {m.status}</div>
        {m.error && <div role="alert">{m.error.message}</div>}
      </div>
    );
  }

  const mutationStatus = () => within(screen.getByLabelText('Approval')).getByRole('status');

  it('runs onMutate → mutationFn → onSuccess → onSettled and reports success', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    const approveCall = deferred<Campaign>();
    const approve = jest.fn(() => approveCall.promise);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={queryFn} />
          <ApproveButton approve={approve} />
        </>,
      ),
    );
    await settle(() => calls[0].resolve(DRAFTS));
    expect(mutationStatus()).toHaveTextContent('mutation idle');

    await user.click(screen.getByRole('button', { name: 'Approve Spring sale' }));
    expect(approve).toHaveBeenCalledWith('c1');
    expect(mutationStatus()).toHaveTextContent('mutation loading');
    // optimistic write visible before the server answers
    expect(itemsOf('draft')).toEqual(['Spring sale · approved', 'Win-back push · draft']);

    await settle(() => approveCall.resolve({ id: 'c1', name: 'Spring sale', status: 'approved' }));
    expect(mutationStatus()).toHaveTextContent('mutation success');
    // onSettled invalidated the list → background refetch
    expect(queryFn).toHaveBeenCalledTimes(2);
    await settle(() => calls[1].resolve([DRAFTS[1]]));
    expect(itemsOf('draft')).toEqual(['Win-back push · draft']);
  });

  it('optimistic update is rolled back from the onMutate context when the mutation fails, then the list is invalidated', async () => {
    const client = createQueryClient();
    const { calls, queryFn } = createSource<Campaign[]>();
    const approveCall = deferred<Campaign>();
    const approve = jest.fn(() => approveCall.promise);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      withClient(
        client,
        <>
          <CampaignList status="draft" queryFn={queryFn} />
          <ApproveButton approve={approve} />
        </>,
      ),
    );
    await settle(() => calls[0].resolve(DRAFTS));

    await user.click(screen.getByRole('button', { name: 'Approve Spring sale' }));
    expect(itemsOf('draft')).toEqual(['Spring sale · approved', 'Win-back push · draft']);

    await settle(() => approveCall.reject(new Error('Approval requires a second reviewer')));
    expect(mutationStatus()).toHaveTextContent('mutation error');
    expect(within(screen.getByLabelText('Approval')).getByRole('alert')).toHaveTextContent(
      'Approval requires a second reviewer',
    );
    // rolled back
    expect(itemsOf('draft')).toEqual(['Spring sale · draft', 'Win-back push · draft']);
    expect(client.getQueryData<Campaign[]>(KEY_DRAFT)).toEqual(DRAFTS);
    // onSettled still invalidates → server truth wins
    expect(queryFn).toHaveBeenCalledTimes(2);
    await settle(() => calls[1].resolve(DRAFTS));
    expect(statusOf('draft')).toHaveTextContent(/^success$/);
  });
});
