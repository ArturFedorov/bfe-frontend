/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Link,
  matchRoutes,
  Navigate,
  Outlet,
  RequireAuth,
  Route,
  RouteObject,
  Router,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from './mini_router';

/* ------------------------------------------------------------------------ */
/* Campaign console used by the UI tests                                     */
/* ------------------------------------------------------------------------ */

function Home() {
  return <h1>Home</h1>;
}

function CampaignsLayout() {
  const location = useLocation();
  return (
    <section aria-label="Campaigns area">
      <h1>Campaigns</h1>
      <p>at {location.pathname}</p>
      <Outlet />
    </section>
  );
}

function CampaignsIndex() {
  return (
    <>
      <h2>All campaigns</h2>
      <nav aria-label="Campaign list">
        <Link to="/campaigns/42?status=draft">Spring sale</Link>
        <Link to="/campaigns/new">Create campaign</Link>
        <Link to="/campaigns/7" replace>
          Win-back push (replace)
        </Link>
      </nav>
    </>
  );
}

function CampaignDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const status = searchParams.get('status') ?? 'all';
  return (
    <article aria-label={`Campaign ${id}`}>
      <h2>Campaign {id}</h2>
      <p>status filter: {status}</p>
      <p>search: {location.search}</p>
      <button type="button" onClick={() => setSearchParams({ status: 'approved' }, { replace: true })}>
        Show approved
      </button>
      <button type="button" onClick={() => setSearchParams((prev) => ({ ...Object.fromEntries(prev), page: '2' }))}>
        Next page
      </button>
      <Link to="/campaigns">Back to list</Link>
    </article>
  );
}

function NewCampaign() {
  const navigate = useNavigate();
  return (
    <>
      <h2>New campaign</h2>
      <button type="button" onClick={() => navigate('/campaigns/99', { state: { created: true } })}>
        Save
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Cancel
      </button>
    </>
  );
}

function Approvals() {
  return <h1>Approvals queue</h1>;
}

function Login() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  return (
    <>
      <h1>Sign in</h1>
      <p>return to: {from ? `${from.pathname}${from.search}` : 'none'}</p>
      {from && <Link to={`${from.pathname}${from.search}`}>Continue</Link>}
    </>
  );
}

function NotFound() {
  const { '*': rest } = useParams();
  return <h1>Not found: {rest}</h1>;
}

function LocationProbe() {
  const location = useLocation();
  return (
    <output aria-label="Location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function App({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <Router>
      <LocationProbe />
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
    </Router>
  );
}

/* ------------------------------------------------------------------------ */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------ */

function setUrl(url: string, state: unknown = null) {
  window.history.replaceState(state, '', url);
}

/** Simulate the browser's Back/Forward: the URL changes first, then `popstate` fires. */
function travel(url: string, state: unknown = null) {
  act(() => {
    window.history.replaceState(state, '', url);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  });
}

const location = () => screen.getByRole('status', { name: 'Location' });
const heading = (level: 1 | 2) => screen.getByRole('heading', { level });

/** Swallow jsdom's default anchor navigation so an un-handled click does not log "Not implemented". */
let preventDefaultNavigation: (e: Event) => void;

beforeEach(() => {
  setUrl('/');
  preventDefaultNavigation = (e: Event) => {
    if ((e.target as HTMLElement).closest('a')) e.preventDefault();
  };
  document.addEventListener('click', preventDefaultNavigation);
});

afterEach(() => {
  document.removeEventListener('click', preventDefaultNavigation);
});

/* ------------------------------------------------------------------------ */

describe('matchRoutes (pure)', () => {
  const routes: RouteObject[] = [
    { path: '/', element: 'home' },
    {
      path: '/campaigns',
      element: 'layout',
      children: [
        { index: true, element: 'index' },
        { path: 'new', element: 'new' },
        { path: ':id', element: 'detail' },
        { path: ':id/messages/:messageId', element: 'message' },
      ],
    },
    { path: '/audiences/*', element: 'audiences' },
    { path: '*', element: 'not-found' },
  ];

  it('returns the root-to-leaf branch with params extracted from :segments', () => {
    const matches = matchRoutes(routes, '/campaigns/42');
    expect(matches?.map((m) => m.route.element)).toEqual(['layout', 'detail']);
    expect(matches?.[1].params).toEqual({ id: '42' });
    expect(matches?.map((m) => m.pathname)).toEqual(['/campaigns', '/campaigns/42']);

    const deep = matchRoutes(routes, '/campaigns/42/messages/m-7/');
    expect(deep?.map((m) => m.route.element)).toEqual(['layout', 'message']);
    expect(deep?.[1].params).toEqual({ id: '42', messageId: 'm-7' });
  });

  it('ranks static segments above params above *: /campaigns/new is the static route, not :id', () => {
    expect(matchRoutes(routes, '/campaigns/new')?.map((m) => m.route.element)).toEqual(['layout', 'new']);
    expect(matchRoutes(routes, '/campaigns/newer')?.map((m) => m.route.element)).toEqual(['layout', 'detail']);
    expect(matchRoutes(routes, '/campaigns')?.map((m) => m.route.element)).toEqual(['layout', 'index']);
    expect(matchRoutes(routes, '/')?.map((m) => m.route.element)).toEqual(['home']);
    // order of definition must not matter for ranking
    const reversed: RouteObject[] = [
      { path: '*', element: 'not-found' },
      { path: '/campaigns/:id', element: 'detail' },
      { path: '/campaigns/new', element: 'new' },
    ];
    expect(matchRoutes(reversed, '/campaigns/new')?.[0].route.element).toBe('new');
    expect(matchRoutes(reversed, '/campaigns/5')?.[0].route.element).toBe('detail');
  });

  it('the longest match wins and * captures the remainder under params["*"]', () => {
    const audiences = matchRoutes(routes, '/audiences/vip/members');
    expect(audiences?.[0].route.element).toBe('audiences');
    expect(audiences?.[0].params).toEqual({ '*': 'vip/members' });

    const missing = matchRoutes(routes, '/reports/weekly');
    expect(missing?.[0].route.element).toBe('not-found');
    expect(missing?.[0].params).toEqual({ '*': 'reports/weekly' });

    expect(matchRoutes([{ path: '/campaigns', element: 'only' }], '/approvals')).toBeNull();
  });
});

describe('Router and Routes rendering', () => {
  it('renders the route for the initial window.location, including nested parent + child through Outlet', () => {
    setUrl('/campaigns/42?status=draft');
    render(<App />);

    const area = screen.getByRole('region', { name: 'Campaigns area' });
    expect(within(area).getByRole('heading', { level: 1 })).toHaveTextContent('Campaigns');
    expect(within(area).getByRole('article', { name: 'Campaign 42' })).toBeInTheDocument();
    expect(screen.getByText('status filter: draft')).toBeInTheDocument();
    expect(location()).toHaveTextContent('/campaigns/42?status=draft');
  });

  it('renders the index child at the parent path and the catch-all for unknown paths', () => {
    setUrl('/campaigns');
    const { unmount } = render(<App />);
    expect(heading(2)).toHaveTextContent('All campaigns');
    unmount();

    setUrl('/reports/weekly');
    render(<App />);
    expect(heading(1)).toHaveTextContent('Not found: reports/weekly');
  });
});

describe('Link', () => {
  it('renders an <a href> and a plain click pushes history and re-renders without a reload', async () => {
    setUrl('/campaigns');
    const user = userEvent.setup();
    render(<App />);
    const before = window.history.length;

    const link = screen.getByRole('link', { name: 'Spring sale' });
    expect(link).toHaveAttribute('href', '/campaigns/42?status=draft');
    await user.click(link);

    expect(window.location.pathname).toBe('/campaigns/42');
    expect(window.location.search).toBe('?status=draft');
    expect(window.history.length).toBe(before + 1);
    expect(screen.getByRole('article', { name: 'Campaign 42' })).toBeInTheDocument();
    expect(location()).toHaveTextContent('/campaigns/42?status=draft');
  });

  it('replace links swap the current entry instead of adding one', async () => {
    setUrl('/campaigns');
    const user = userEvent.setup();
    render(<App />);
    const before = window.history.length;

    await user.click(screen.getByRole('link', { name: 'Win-back push (replace)' }));
    expect(window.location.pathname).toBe('/campaigns/7');
    expect(window.history.length).toBe(before);
    expect(screen.getByRole('article', { name: 'Campaign 7' })).toBeInTheDocument();
  });

  it('ignores modified clicks and middle clicks so the browser can open a new tab', () => {
    setUrl('/campaigns');
    render(<App />);
    const before = window.history.length;
    const link = screen.getByRole('link', { name: 'Create campaign' });

    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { shiftKey: true });
    fireEvent.click(link, { button: 1 });

    expect(window.location.pathname).toBe('/campaigns');
    expect(window.history.length).toBe(before);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('All campaigns');
  });
});

describe('popstate (Back / Forward)', () => {
  it('re-renders from the URL when the browser fires popstate, in both directions', async () => {
    setUrl('/campaigns');
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Spring sale' }));
    expect(screen.getByRole('article', { name: 'Campaign 42' })).toBeInTheDocument();

    travel('/campaigns'); // Back
    expect(heading(2)).toHaveTextContent('All campaigns');
    expect(location()).toHaveTextContent(/^\/campaigns$/);

    travel('/campaigns/42?status=draft'); // Forward
    expect(screen.getByRole('article', { name: 'Campaign 42' })).toBeInTheDocument();
    expect(screen.getByText('status filter: draft')).toBeInTheDocument();

    travel('/'); // Back twice
    expect(heading(1)).toHaveTextContent('Home');
  });
});

describe('hooks', () => {
  it('useParams, useLocation and useSearchParams read the current entry; useNavigate pushes with state', async () => {
    setUrl('/campaigns/new');
    const user = userEvent.setup();
    render(<App />);
    expect(heading(2)).toHaveTextContent('New campaign');
    const before = window.history.length;

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(window.location.pathname).toBe('/campaigns/99');
    expect(window.history.state).toEqual({ created: true });
    expect(window.history.length).toBe(before + 1);
    expect(screen.getByRole('article', { name: 'Campaign 99' })).toBeInTheDocument();
    expect(screen.getByText('status filter: all')).toBeInTheDocument();
  });

  it('useNavigate(-1) delegates to history.go', async () => {
    setUrl('/campaigns/new');
    const go = jest.spyOn(window.history, 'go').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(go).toHaveBeenCalledWith(-1);
    go.mockRestore();
  });

  it('setSearchParams with replace updates the query without growing history; without replace it pushes', async () => {
    setUrl('/campaigns/42?status=draft');
    const user = userEvent.setup();
    render(<App />);
    const before = window.history.length;

    await user.click(screen.getByRole('button', { name: 'Show approved' }));
    expect(window.location.search).toBe('?status=approved');
    expect(window.location.pathname).toBe('/campaigns/42');
    expect(window.history.length).toBe(before);
    expect(screen.getByText('status filter: approved')).toBeInTheDocument();
    expect(location()).toHaveTextContent('/campaigns/42?status=approved');

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(window.location.search).toBe('?status=approved&page=2');
    expect(window.history.length).toBe(before + 1);
    expect(screen.getByText('search: ?status=approved&page=2')).toBeInTheDocument();
  });
});

describe('Navigate and RequireAuth', () => {
  it('a <Navigate replace> route redirects once without leaving the old entry behind', () => {
    setUrl('/legacy');
    const before = window.history.length;
    render(<App />);
    expect(window.location.pathname).toBe('/campaigns');
    expect(window.history.length).toBe(before);
    expect(heading(2)).toHaveTextContent('All campaigns');
  });

  it('RequireAuth redirects anonymous users to redirectTo (replace) and preserves `from` so login can return', () => {
    setUrl('/approvals?tab=pending');
    const before = window.history.length;
    render(<App />);

    expect(heading(1)).toHaveTextContent('Sign in');
    expect(window.location.pathname).toBe('/login');
    expect(window.history.length).toBe(before);
    expect((window.history.state as { from: { pathname: string } }).from.pathname).toBe('/approvals');
    expect(screen.getByText('return to: /approvals?tab=pending')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/approvals?tab=pending');
    expect(screen.queryByText('Approvals queue')).not.toBeInTheDocument();
  });

  it('RequireAuth renders its children for authenticated users, and flipping auth later swaps without a remount of Router', async () => {
    setUrl('/approvals');
    const user = userEvent.setup();
    function Shell() {
      const [authed, setAuthed] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setAuthed(false)}>
            Sign out
          </button>
          <App authenticated={authed} />
        </>
      );
    }
    render(<Shell />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Approvals queue');

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in');
    expect(screen.getByText('return to: /approvals')).toBeInTheDocument();
  });
});
