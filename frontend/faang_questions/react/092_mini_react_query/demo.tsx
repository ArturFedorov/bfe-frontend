import { useEffect, useRef, useState } from 'react';
import {
  createQueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from './mini_react_query';

/**
 * Demo harness for the mini React Query — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is mini_react_query.test.tsx.
 *
 * A fake campaigns service answers after ~700ms and counts its requests.
 * Three panels read the same `['campaigns', { status: 'draft' }]` key, so a
 * working implementation shows one request for three panels, instant cached
 * renders when a panel is toggled back on (plus a background refetch once the
 * 5s staleTime has passed), and an optimistic approval that rolls back when
 * the server rejects it.
 */

interface Campaign {
  id: string;
  name: string;
  channel: 'email' | 'push' | 'in-app';
  status: 'draft' | 'approved';
}

const KEY = ['campaigns', { status: 'draft' }];
const STALE_TIME = 5_000;

// ---------------------------------------------------------------------------
// Fake campaigns service
// ---------------------------------------------------------------------------

let serverCampaigns: Campaign[] = [
  { id: 'c1', name: 'Spring sale announcement', channel: 'email', status: 'draft' },
  { id: 'c2', name: 'Cart abandonment nudge', channel: 'push', status: 'draft' },
  { id: 'c3', name: 'Loyalty tier upgrade', channel: 'in-app', status: 'draft' },
  { id: 'c4', name: 'Win-back after 90 days', channel: 'email', status: 'draft' },
];
let requestCount = 0;
let failNextApproval = false;
const requestListeners = new Set<() => void>();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDrafts(): Promise<Campaign[]> {
  requestCount += 1;
  for (const l of requestListeners) l();
  await wait(700);
  return serverCampaigns.filter((c) => c.status === 'draft').map((c) => ({ ...c }));
}

async function approveCampaign(id: string): Promise<Campaign> {
  await wait(900);
  if (failNextApproval) {
    failNextApproval = false;
    throw new Error('Approval rejected: campaign needs a second reviewer');
  }
  serverCampaigns = serverCampaigns.map((c) => (c.id === id ? { ...c, status: 'approved' } : c));
  const approved = serverCampaigns.find((c) => c.id === id);
  if (!approved) throw new Error(`Unknown campaign ${id}`);
  return approved;
}

function resetServer(): void {
  serverCampaigns = serverCampaigns.map((c) => ({ ...c, status: 'draft' }));
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

function DraftList({ title }: { title: string }) {
  const renders = useRef(0);
  renders.current += 1;
  const q = useQuery<Campaign[]>({ queryKey: KEY, queryFn: fetchDrafts, staleTime: STALE_TIME });
  return (
    <section
      aria-label={title}
      style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem', flex: 1, minWidth: 220 }}
    >
      <strong>{title}</strong>
      <div role="status" style={{ fontSize: '0.85rem', color: '#555' }}>
        {q.status}
        {q.isFetching ? ' · fetching…' : ''} · renders {renders.current}
      </div>
      {q.error && <div role="alert">{q.error.message}</div>}
      <ul style={{ paddingLeft: '1.1rem', margin: '0.5rem 0' }}>
        {q.data?.map((c) => (
          <li key={c.id}>
            {c.name} <small>({c.channel})</small>
          </li>
        ))}
      </ul>
      <button onClick={() => void q.refetch()}>Refetch</button>
    </section>
  );
}

function ApprovalPanel() {
  const client = useQueryClient();
  const drafts = useQuery<Campaign[]>({ queryKey: KEY, queryFn: fetchDrafts, staleTime: STALE_TIME });
  const approval = useMutation<string, Campaign, { previous: Campaign[] | undefined }>({
    mutationFn: approveCampaign,
    onMutate: (id) => {
      const previous = client.getQueryData<Campaign[]>(KEY);
      client.setQueryData<Campaign[]>(KEY, (old) => (old ?? []).filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context) client.setQueryData<Campaign[]>(KEY, context.previous ?? []);
    },
    onSettled: () => {
      void client.invalidateQueries(['campaigns']);
    },
  });

  return (
    <section
      aria-label="Approvals"
      style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem', flex: 1, minWidth: 220 }}
    >
      <strong>Approvals</strong>
      <div role="status" style={{ fontSize: '0.85rem', color: '#555' }}>
        mutation {approval.status}
      </div>
      {approval.error && <div role="alert">{approval.error.message}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0' }}>
        {drafts.data?.map((c) => (
          <li key={c.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ flex: 1 }}>{c.name}</span>
            <button onClick={() => void approval.mutate(c.id)} disabled={approval.status === 'loading'}>
              Approve
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

const client = createQueryClient();

export default function Demo() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [requests, setRequests] = useState(requestCount);
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => setRequests(requestCount);
    requestListeners.add(listener);
    return () => {
      requestListeners.delete(listener);
    };
  }, []);

  const armFailure = () => {
    failNextApproval = true;
    bump((n) => n + 1);
  };

  return (
    <div className="demo">
      <h2>Mini React Query</h2>
      <p className="demo-note">
        Implement <code>createQueryClient</code>, <code>QueryClientProvider</code>, <code>useQuery</code>,{' '}
        <code>useMutation</code> and <code>hashQueryKey</code> in <code>mini_react_query.tsx</code>. Three
        panels share the <code>[&apos;campaigns&apos;, {'{ status: \'draft\' }'}]</code> key: the request
        counter below should read 1 after the first load, not 3. Toggle a panel off and on within 5s and it
        renders from cache with no request; after 5s it renders cached data and refetches in the background.
        &quot;Approve&quot; removes the row optimistically, then invalidates; arm a failure first and watch the row
        come back.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <span>
            server requests: <strong>{requests}</strong>
          </span>
          <button onClick={() => setShowSidebar((v) => !v)}>{showSidebar ? 'Hide' : 'Show'} sidebar</button>
          <button onClick={() => setShowDashboard((v) => !v)}>{showDashboard ? 'Hide' : 'Show'} dashboard</button>
          <button onClick={armFailure} disabled={failNextApproval}>
            {failNextApproval ? 'Next approval will fail' : 'Fail next approval'}
          </button>
          <button
            onClick={() => {
              resetServer();
              void client.invalidateQueries(['campaigns']);
            }}
          >
            Reset server + invalidate
          </button>
        </div>
        <QueryClientProvider client={client}>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {showSidebar && <DraftList title="Sidebar" />}
            {showDashboard && <DraftList title="Dashboard" />}
            <ApprovalPanel />
          </div>
        </QueryClientProvider>
      </div>
    </div>
  );
}
