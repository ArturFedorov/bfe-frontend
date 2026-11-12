import { useState } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  RequireAuth,
  Route,
  Router,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from './mini_router';

/**
 * Demo harness for the mini router — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is mini_router.test.tsx.
 *
 * The playground itself routes with the URL hash (`#/093_mini_router`), so
 * this demo can use the real pathname and History API without fighting it:
 * the links below call pushState/replaceState, and the browser's Back and
 * Forward buttons drive `popstate`. Vite's dev server serves index.html for
 * any path, so a reload on `/campaigns/42` lands back here. Use "Return to
 * playground root" to put the pathname back to `/` when you are done.
 */

interface Campaign {
  id: string;
  name: string;
  channel: 'email' | 'push' | 'in-app';
  status: 'draft' | 'approved';
}

const CAMPAIGNS: Campaign[] = [
  { id: '42', name: 'Spring sale announcement', channel: 'email', status: 'draft' },
  { id: '7', name: 'Cart abandonment nudge', channel: 'push', status: 'approved' },
  { id: '13', name: 'Loyalty tier upgrade', channel: 'in-app', status: 'draft' },
  { id: '21', name: 'Win-back after 90 days', channel: 'email', status: 'approved' },
];

function Nav({ authenticated, onToggleAuth }: { authenticated: boolean; onToggleAuth: () => void }) {
  const location = useLocation();
  return (
    <nav aria-label="Console" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Link to="/">Home</Link>
      <Link to="/campaigns">Campaigns</Link>
      <Link to="/campaigns/new">New campaign</Link>
      <Link to="/approvals">Approvals (auth)</Link>
      <Link to="/legacy">/legacy (redirect)</Link>
      <Link to="/reports/weekly">Unknown path</Link>
      <button onClick={onToggleAuth}>{authenticated ? 'Sign out' : 'Sign in'}</button>
      <code style={{ marginLeft: 'auto' }}>
        {location.pathname}
        {location.search}
      </code>
    </nav>
  );
}

function Home() {
  return (
    <>
      <h3>Home</h3>
      <p>Pick a section above. Then use the browser Back / Forward buttons.</p>
    </>
  );
}

function CampaignsLayout() {
  return (
    <section aria-label="Campaigns area" style={{ borderLeft: '3px solid #e5e7eb', paddingLeft: '0.75rem' }}>
      <h3>Campaigns</h3>
      <Outlet />
    </section>
  );
}

function CampaignsIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const visible = CAMPAIGNS.filter((c) => status === 'all' || c.status === status);
  return (
    <>
      <label>
        Status filter{' '}
        <select
          value={status}
          onChange={(e) =>
            setSearchParams(e.target.value === 'all' ? {} : { status: e.target.value }, { replace: true })
          }
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
        </select>
      </label>
      <p className="demo-note">The filter uses replace — Back skips over filter changes.</p>
      <ul>
        {visible.map((c) => (
          <li key={c.id}>
            <Link to={`/campaigns/${c.id}`}>{c.name}</Link> <small>({c.channel})</small>
          </li>
        ))}
      </ul>
    </>
  );
}

function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaign = CAMPAIGNS.find((c) => c.id === id);
  if (!campaign) return <p>No campaign with id {id}.</p>;
  return (
    <article aria-label={`Campaign ${campaign.id}`}>
      <h4>{campaign.name}</h4>
      <p>
        id <code>{campaign.id}</code> · channel {campaign.channel} · {campaign.status}
      </p>
      <button onClick={() => navigate(-1)}>Back (history.go(-1))</button>{' '}
      <Link to="/campaigns" replace>
        List (replace)
      </Link>
    </article>
  );
}

function NewCampaign() {
  const navigate = useNavigate();
  return (
    <>
      <h4>New campaign</h4>
      <p>Static <code>/campaigns/new</code> outranks <code>/campaigns/:id</code>.</p>
      <button onClick={() => navigate('/campaigns/42', { state: { created: true } })}>Save and open 42</button>
    </>
  );
}

function Approvals() {
  return <h3>Approvals queue</h3>;
}

function Login() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  return (
    <>
      <h3>Sign in</h3>
      <p>
        You were sent here from <code>{from ? `${from.pathname}${from.search}` : '(nowhere)'}</code>. Click
        &quot;Sign in&quot; in the nav, then:
      </p>
      {from && <Link to={`${from.pathname}${from.search}`}>Continue to {from.pathname}</Link>}
    </>
  );
}

function NotFound() {
  const { '*': rest } = useParams();
  return <h3>Not found: /{rest}</h3>;
}

export default function Demo() {
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <div className="demo">
      <h2>Mini Router</h2>
      <p className="demo-note">
        Implement <code>Router</code>, <code>Routes</code>, <code>Route</code>, <code>Outlet</code>,{' '}
        <code>Link</code>, <code>Navigate</code>, <code>RequireAuth</code>, the hooks and the pure{' '}
        <code>matchRoutes</code> in <code>mini_router.tsx</code>. Links push real history entries (watch the
        address bar), Back/Forward re-render via <code>popstate</code>, the status filter uses replace so it does
        not pollute history, <code>/legacy</code> redirects, and <code>/approvals</code> bounces anonymous users
        to a login page that remembers where they came from.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => window.history.pushState(null, '', '/')}>Return to playground root</button>
        </div>
        <Router>
          <Nav authenticated={authenticated} onToggleAuth={() => setAuthenticated((v) => !v)} />
          <div style={{ marginTop: '1rem' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<CampaignsLayout />}>
                <Route index element={<CampaignsIndex />} />
                <Route path="new" element={<NewCampaign />} />
                <Route path=":id" element={<CampaignDetail />} />
              </Route>
              <Route
                path="/approvals"
                element={
                  <RequireAuth isAuthenticated={authenticated} redirectTo="/login">
                    <Approvals />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/legacy" element={<Navigate to="/campaigns" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </div>
    </div>
  );
}
