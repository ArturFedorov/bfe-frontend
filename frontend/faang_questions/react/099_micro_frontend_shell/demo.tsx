import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  Shell,
  createEventBus,
  type RemoteManifest,
  type RemoteModule,
  type RemoteProps,
  type Theme,
} from './mfe_shell';

/**
 * Demo harness for the micro-frontend shell — auto-discovered by the
 * playground (playground/App.tsx). The "remotes" are plain components defined
 * below; `load` resolves them after an artificial delay and can be made to
 * fail on demand so you can exercise the error boundary and Retry. Not part of
 * the task: the spec lives in README.md and the grader is mfe_shell.test.tsx.
 */

const CAMPAIGNS = [
  { id: 'c-101', name: 'Spring loyalty push' },
  { id: 'c-102', name: 'Churn win-back (email)' },
  { id: 'c-103', name: 'In-app onboarding v3' },
];

const CampaignsRemote: ComponentType<RemoteProps> = ({ bus, user, theme }) => (
  <section>
    <h3>Campaigns</h3>
    <p>
      Signed in as {user.name} · theme {theme}
    </p>
    <ul>
      {CAMPAIGNS.map((c) => (
        <li key={c.id}>
          <button type="button" onClick={() => bus.emit('campaign:selected', c.id)}>
            Select {c.name}
          </button>
        </li>
      ))}
    </ul>
  </section>
);

const AudiencesRemote: ComponentType<RemoteProps> = ({ bus }) => {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => bus.on<string>('campaign:selected', setSelected), [bus]);
  return (
    <section>
      <h3>Audiences</h3>
      <p>
        Building audience for campaign: <strong>{selected ?? 'none selected yet'}</strong>
      </p>
      <p>
        Emits only reach this remote while it is mounted — navigate to Campaigns, select one,
        then come back: the subscription was torn down, so this stays as it was.
      </p>
    </section>
  );
};

const TemplatesRemote: ComponentType<RemoteProps> = ({ theme }) => (
  <section>
    <h3>Templates</h3>
    <p>12 email templates, 4 push templates. Rendering in {theme} mode.</p>
  </section>
);

const REMOTE_COMPONENTS: Record<string, ComponentType<RemoteProps>> = {
  campaigns: CampaignsRemote,
  audiences: AudiencesRemote,
  templates: TemplatesRemote,
};

export default function Demo() {
  const [theme, setTheme] = useState<Theme>('light');
  const [failNext, setFailNext] = useState(false);
  const failRef = useRef(failNext);
  failRef.current = failNext;
  const [session, setSession] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const calls = useRef<Record<string, number>>({});
  const [, force] = useState(0);

  const bus = useMemo(() => createEventBus(), []);
  useEffect(
    () =>
      bus.on<string>('campaign:selected', (id) =>
        setLog((l) => [`host saw campaign:selected → ${id}`, ...l].slice(0, 5)),
      ),
    [bus],
  );

  const remotes = useMemo<RemoteManifest[]>(
    () =>
      (['campaigns', 'audiences', 'templates'] as const).map((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        route: `/${id}`,
        load: () => {
          calls.current[id] = (calls.current[id] ?? 0) + 1;
          force((n) => n + 1);
          const shouldFail = failRef.current;
          return new Promise<RemoteModule>((resolve, reject) => {
            setTimeout(() => {
              if (shouldFail) reject(new Error(`Simulated bundle 404 for ${id}`));
              else resolve({ default: REMOTE_COMPONENTS[id] });
            }, 900);
          });
        },
      })),
    [],
  );

  return (
    <div className="demo">
      <h2>Micro-Frontend Shell</h2>
      <p className="demo-note">
        Implement <code>createEventBus</code> and <code>Shell</code> in <code>mfe_shell.tsx</code>.
        Each remote &quot;bundle&quot; resolves after 900ms; the counter shows how many times each{' '}
        <code>load</code> ran — switching back and forth must not increase it. Turn on the failure
        toggle before first opening a remote to see the <code>role=&quot;alert&quot;</code> and{' '}
        <code>Retry</code>; turn it off and retry to recover. Select a campaign inside Campaigns:
        the host log below listens on the same bus, and the Audiences remote only hears it while
        mounted. (StrictMode may double the first mount&apos;s count in dev.)
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            <input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} />{' '}
            Fail the next load
          </label>
          <button type="button" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
            Theme: {theme}
          </button>
          <button type="button" onClick={() => setSession((s) => s + 1)}>
            Remount shell (clears cache)
          </button>
          <span>
            load calls:{' '}
            {Object.entries(calls.current)
              .map(([id, n]) => `${id}=${n}`)
              .join(' ') || 'none'}
          </span>
        </div>
        <Shell key={session} remotes={remotes} user={{ id: 'u1', name: 'Jordan' }} theme={theme} bus={bus} />
        <p className="demo-note">Host bus log: {log.length ? log.join(' · ') : 'nothing yet'}</p>
      </div>
    </div>
  );
}
