import { useEffect, useState } from 'react';
import { api as defaultApi, type Api } from '../shell/api';
import { useSession } from '../shell/session';
import type { Campaign, CampaignStatus } from '../shell/types';
import { AREAS } from './milestones';

/**
 * Milestone 1 — the one area that works out of the box. Deliberately plain
 * `useEffect` + cancelled flag: when milestone 2 lands you can migrate it to
 * `useQuery` and watch the duplicated request disappear.
 */

const STATUS_ORDER: CampaignStatus[] = [
  'draft',
  'pending_approval',
  'scheduled',
  'running',
  'paused',
  'completed',
];

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  scheduled: 'Scheduled',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
};

export interface DashboardProps {
  api?: Api;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; campaigns: Campaign[] };

export function Dashboard({ api = defaultApi }: DashboardProps) {
  const { user, flags, setFlag } = useSession();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    api
      .listCampaigns({ page: 1, pageSize: 100 })
      .then((page) => {
        if (!cancelled) setState({ kind: 'ready', campaigns: page.items });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ kind: 'error', message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);

  return (
    <div className="dashboard">
      <h2>Good to see you, {user.name.split(' ')[0]}</h2>
      <p className="muted">
        You are signed in as <strong>{user.role}</strong>. Approvers can approve
        pending campaigns once milestone 2 is solved.
      </p>

      {state.kind === 'loading' && (
        <p role="status">Loading campaign summary…</p>
      )}
      {state.kind === 'error' && (
        <div role="alert" className="card crash">
          <p>Could not load campaigns: {state.message}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}
      {state.kind === 'ready' && (
        <dl className="stats" aria-label="Campaigns by status">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="stat">
              <dt>{STATUS_LABEL[status]}</dt>
              <dd>
                {state.campaigns.filter((c) => c.status === status).length}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <section className="card" aria-labelledby="flags-title">
        <h3 id="flags-title">Feature flags</h3>
        <ul className="flags">
          {Object.entries(flags).map(([name, on]) => (
            <li key={name}>
              <label>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setFlag(name, e.target.checked)}
                />{' '}
                {name}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="progress-title">
        <h3 id="progress-title">Milestones</h3>
        <ol className="milestone-list">
          <li>
            <strong>01</strong> Shell: store, session, fake API —{' '}
            <em>done, you are looking at it</em>
          </li>
          {AREAS.filter((a) => a.milestone).map((a) => (
            <li key={a.id}>
              <strong>{a.milestone!.id}</strong> {a.milestone!.title} —{' '}
              <code>{a.label}</code> tab
            </li>
          ))}
          <li>
            <strong>03</strong> Router — replaces the tab switch in{' '}
            <code>app/App.tsx</code>
          </li>
        </ol>
      </section>
    </div>
  );
}
