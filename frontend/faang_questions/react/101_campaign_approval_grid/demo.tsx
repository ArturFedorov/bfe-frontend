import { useMemo, useState } from 'react';
import { ApprovalGrid, type ApprovalApi, type Campaign, type ListParams } from './approval_grid';

/**
 * Demo harness for the approval grid — auto-discovered by the playground
 * (playground/App.tsx). The API is an in-memory store of 37 campaigns with an
 * artificial latency, plus a toggle that makes `approve` reject so you can see
 * the rollback. Filters live in the real URL: change them and use the browser
 * Back button. Not part of the task: the spec lives in README.md and the
 * grader is approval_grid.test.tsx.
 */

const KINDS = ['Spring loyalty', 'Churn win-back', 'Onboarding drip', 'Flash sale', 'Re-engagement'];
const CHANNELS = ['email', 'push', 'in-app'];

function seed(): Campaign[] {
  return Array.from({ length: 37 }, (_, i) => ({
    id: `c-${i + 1}`,
    name: `${KINDS[i % KINDS.length]} (${CHANNELS[(i * 7) % CHANNELS.length]}) #${i + 1}`,
    status: i % 4 === 0 ? 'approved' : 'pending',
    updatedAt: new Date(Date.UTC(2026, 2, 1 + ((i * 11) % 28), (i * 5) % 24)).toISOString(),
  }));
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Demo() {
  const [latency, setLatency] = useState(700);
  const [failApprove, setFailApprove] = useState(false);
  const [calls, setCalls] = useState<string[]>([]);
  const store = useMemo(() => ({ rows: seed() }), []);

  const api = useMemo<ApprovalApi>(() => {
    const log = (line: string) => setCalls((c) => [line, ...c].slice(0, 6));
    return {
      async list(params: ListParams) {
        log(`list(page=${params.page}, status=${params.status}, sort=${params.sort})`);
        await wait(latency);
        const filtered = store.rows.filter((r) => params.status === 'all' || r.status === params.status);
        const sorted = [...filtered].sort((a, b) =>
          params.sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt),
        );
        const start = (params.page - 1) * params.pageSize;
        return { rows: sorted.slice(start, start + params.pageSize), total: sorted.length };
      },
      async approve(ids: string[]) {
        log(`approve(${ids.length} id${ids.length === 1 ? '' : 's'})`);
        await wait(latency);
        if (failApprove) throw new Error('Approval service rejected the request (simulated)');
        for (const r of store.rows) if (ids.includes(r.id)) r.status = 'approved';
      },
    };
  }, [latency, failApprove, store]);

  return (
    <div className="demo">
      <h2>Campaign Approval Grid</h2>
      <p className="demo-note">
        Implement <code>parseGridParams</code>, <code>serializeGridParams</code> and{' '}
        <code>ApprovalGrid</code> in <code>approval_grid.tsx</code>. Filters are written to the
        address bar with <code>pushState</code> — change them and press Back. Select rows across
        pages (the count survives paging and sorting), then approve: rows vanish immediately and
        the page refetches once the server confirms. Turn on the failure toggle to watch the rows
        come back with a <code>role=&quot;alert&quot;</code>. Change the sort while an approval is
        pending to exercise the two-in-flight case. (The grid remounts when you change the API
        settings, so the URL state is what carries over.)
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            Latency{' '}
            <input
              type="range"
              min={0}
              max={3000}
              step={100}
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
            />{' '}
            {latency}ms
          </label>
          <label>
            <input type="checkbox" checked={failApprove} onChange={(e) => setFailApprove(e.target.checked)} />{' '}
            Make approve fail
          </label>
          <span>API log: {calls.length ? calls.join(' · ') : 'none yet'}</span>
        </div>
        <ApprovalGrid key={`${latency}-${failApprove}`} api={api} pageSize={8} />
      </div>
    </div>
  );
}
