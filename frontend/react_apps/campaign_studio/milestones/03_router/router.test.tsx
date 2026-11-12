/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryHistory,
  createRoutesFromChildren,
  generatePath,
  Link,
  matchRoutes,
  Navigate,
  Outlet,
  rankRoutePath,
  Route,
  Router,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type History,
  type RouteObject,
} from './router';

const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: null,
    children: [
      { index: true, element: null },
      {
        path: 'campaigns',
        element: null,
        children: [{ path: ':id', element: null }],
      },
      { path: 'campaigns/new', element: null },
      { path: 'templates/:id?', element: null },
      { path: 'files/*', element: null },
      { path: '*', element: null },
    ],
  },
];

function leafPaths(matches: ReturnType<typeof matchRoutes>) {
  return matches
    ? matches.map(
        (m) => m.route.path ?? (m.route.index ? '<index>' : '<layout>'),
      )
    : null;
}

describe('03 — history', () => {
  it('createMemoryHistory: initial location, push/replace/go, listen + unsubscribe', () => {
    const history = createMemoryHistory(['/a', '/b?x=1#top'], 1);
    expect(history.location).toEqual({
      pathname: '/b',
      search: '?x=1',
      hash: '#top',
    });

    const seen: string[] = [];
    const unlisten = history.listen((loc) =>
      seen.push(loc.pathname + loc.search),
    );

    history.push('/c');
    expect(history.location.pathname).toBe('/c');
    history.push({ pathname: '/d', search: '?page=2' });
    expect(history.location).toEqual({
      pathname: '/d',
      search: '?page=2',
      hash: '',
    });
    history.replace('/e');
    history.go(-1); // replace consumed /d, so back lands on /c
    expect(history.location.pathname).toBe('/c');
    history.go(1);
    expect(history.location.pathname).toBe('/e');
    history.go(-10); // clamps at the first entry
    expect(history.location.pathname).toBe('/a');
    expect(seen).toEqual(['/c', '/d?page=2', '/e', '/c', '/e', '/a']);

    unlisten();
    history.push('/f');
    expect(seen).toHaveLength(6);
  });
});

describe('03 — matching', () => {
  it('rankRoutePath: static > dynamic > optional > splat, more segments win, index adds 2', () => {
    expect(rankRoutePath('campaigns/new')).toBeGreaterThan(
      rankRoutePath('campaigns/:id'),
    );
    expect(rankRoutePath('campaigns/:id')).toBeGreaterThan(
      rankRoutePath('campaigns/:id?'),
    );
    expect(rankRoutePath('campaigns/:id')).toBeGreaterThan(
      rankRoutePath('campaigns/*'),
    );
    expect(rankRoutePath('a/b')).toBeGreaterThan(rankRoutePath('a'));
    expect(rankRoutePath('', true)).toBe(rankRoutePath('') + 2);
  });

  it('matchRoutes picks the most specific leaf regardless of definition order', () => {
    expect(leafPaths(matchRoutes(appRoutes, '/campaigns/new'))).toEqual([
      '/',
      'campaigns/new',
    ]);
    const dyn = matchRoutes(appRoutes, '/campaigns/c07')!;
    expect(leafPaths(dyn)).toEqual(['/', 'campaigns', ':id']);
    expect(dyn[2].params).toEqual({ id: 'c07' });
    expect(leafPaths(matchRoutes(appRoutes, '/files/a/b/c'))).toEqual([
      '/',
      'files/*',
    ]);
    expect(matchRoutes(appRoutes, '/files/a/b/c')![1].params['*']).toBe(
      'a/b/c',
    );
    expect(leafPaths(matchRoutes(appRoutes, '/nothing/here'))).toEqual([
      '/',
      '*',
    ]);
    expect(
      matchRoutes([{ path: 'only', element: null }], '/elsewhere'),
    ).toBeNull();
  });

  it('matchRoutes: index routes, optional params, trailing slash, decoding, per-level pathname and params accumulation', () => {
    expect(leafPaths(matchRoutes(appRoutes, '/'))).toEqual(['/', '<index>']);
    expect(leafPaths(matchRoutes(appRoutes, '/templates'))).toEqual([
      '/',
      'templates/:id?',
    ]);
    expect(matchRoutes(appRoutes, '/templates')![1].params).toEqual({});
    expect(matchRoutes(appRoutes, '/templates/t2/')![1].params).toEqual({
      id: 't2',
    });
    expect(matchRoutes(appRoutes, '/campaigns/c%20one')![2].params.id).toBe(
      'c one',
    );

    const nested: RouteObject[] = [
      {
        path: 'orgs/:orgId',
        element: null,
        children: [
          {
            path: 'teams/:teamId',
            element: null,
            children: [{ path: 'members', element: null }],
          },
        ],
      },
    ];
    const chain = matchRoutes(nested, '/orgs/acme/teams/t1/members')!;
    expect(chain.map((m) => m.pathname)).toEqual([
      '/orgs/acme',
      '/orgs/acme/teams/t1',
      '/orgs/acme/teams/t1/members',
    ]);
    expect(chain[2].params).toEqual({ orgId: 'acme', teamId: 't1' });
    expect(chain[0].params).toEqual({ orgId: 'acme' });
  });

  it('generatePath fills params and encodes them', () => {
    expect(generatePath('/campaigns/:id', { id: 'c01' })).toBe(
      '/campaigns/c01',
    );
    expect(generatePath('/templates/:id?')).toBe('/templates');
    expect(generatePath('/search/:q', { q: 'a b' })).toBe('/search/a%20b');
    expect(generatePath('/files/*', { '*': 'x/y' })).toBe('/files/x/y');
    expect(() => generatePath('/campaigns/:id')).toThrow(/id/);
  });

  it('createRoutesFromChildren converts nested <Route> elements', () => {
    const routes = createRoutesFromChildren(
      <>
        <Route path="/" element={<p>layout</p>}>
          <Route index element={<p>home</p>} />
          <Route path="campaigns" element={<p>list</p>}>
            <Route path=":id" element={<p>detail</p>} />
          </Route>
        </Route>
        <Route path="*" element={<p>404</p>} />
      </>,
    );
    expect(routes).toHaveLength(2);
    expect(routes[0].path).toBe('/');
    expect(routes[0].children).toHaveLength(2);
    expect(routes[0].children![0].index).toBe(true);
    expect(routes[0].children![1].children![0].path).toBe(':id');
    expect(routes[1].path).toBe('*');
  });
});

function Layout() {
  const location = useLocation();
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/campaigns">Campaigns</Link>
        <Link to={{ pathname: '/campaigns/c01', search: '?tab=stats' }}>
          C01
        </Link>
      </nav>
      <output data-testid="loc">{location.pathname + location.search}</output>
      <Outlet />
    </div>
  );
}

function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  return (
    <div>
      <h2>Campaign {id}</h2>
      <output data-testid="tab">{params.get('tab') ?? 'none'}</output>
      <button onClick={() => setParams({ tab: 'audience' })}>
        Audience tab
      </button>
      <button
        onClick={() =>
          setParams((prev) => ({ ...Object.fromEntries(prev), page: '2' }), {
            replace: true,
          })
        }
      >
        Page 2
      </button>
    </div>
  );
}

function CampaignsList() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>All campaigns</h2>
      <button onClick={() => navigate('/campaigns/c02')}>Open c02</button>
      <button onClick={() => navigate(-1)}>Back</button>
      <Outlet />
    </div>
  );
}

function renderApp(history: History) {
  return render(
    <Router history={history}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<h2>Dashboard</h2>} />
          <Route path="campaigns" element={<CampaignsList />}>
            <Route path=":id" element={<CampaignDetail />} />
          </Route>
          <Route path="legacy" element={<Navigate to="/campaigns" replace />} />
          <Route path="*" element={<h2>Not found</h2>} />
        </Route>
      </Routes>
    </Router>,
  );
}

describe('03 — components and hooks', () => {
  it('Routes renders the matched chain through nested Outlets, including index and 404', () => {
    const history = createMemoryHistory(['/']);
    renderApp(history);
    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();

    act(() => history.push('/campaigns/c01'));
    expect(
      screen.getByRole('heading', { name: 'All campaigns' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Campaign c01' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();

    act(() => history.push('/campaigns'));
    expect(
      screen.getByRole('heading', { name: 'All campaigns' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Campaign c/ }),
    ).not.toBeInTheDocument();

    act(() => history.push('/does/not/exist'));
    expect(
      screen.getByRole('heading', { name: 'Not found' }),
    ).toBeInTheDocument();
  });

  it('Link navigates on plain click, sets aria-current, and lets modified clicks through', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory(['/']);
    renderApp(history);
    const home = screen.getByRole('link', { name: 'Home' });
    const campaigns = screen.getByRole('link', { name: 'Campaigns' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(campaigns).not.toHaveAttribute('aria-current');
    expect(campaigns).toHaveAttribute(
      'href',
      expect.stringMatching(/\/campaigns$/),
    );

    await user.click(campaigns);
    expect(history.location.pathname).toBe('/campaigns');
    expect(screen.getByRole('link', { name: 'Campaigns' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );

    await user.click(screen.getByRole('link', { name: 'C01' }));
    expect(screen.getByTestId('loc')).toHaveTextContent(
      '/campaigns/c01?tab=stats',
    );
    expect(screen.getByTestId('tab')).toHaveTextContent('stats');

    // modified click: the router must not intercept (browser would open a new tab)
    const before = history.location.pathname;
    const event = fireEvent.click(screen.getByRole('link', { name: 'Home' }), {
      metaKey: true,
    });
    expect(event).toBe(true); // not defaultPrevented
    expect(history.location.pathname).toBe(before);
    const right = fireEvent.click(screen.getByRole('link', { name: 'Home' }), {
      button: 2,
    });
    expect(right).toBe(true);
    expect(history.location.pathname).toBe(before);
  });

  it('Navigate redirects on mount with replace, so Back skips the redirecting entry', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory(['/', '/legacy'], 1);
    renderApp(history);
    expect(history.location.pathname).toBe('/campaigns');
    expect(
      screen.getByRole('heading', { name: 'All campaigns' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(history.location.pathname).toBe('/');
    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
  });

  it('useNavigate pushes paths and deltas; useParams reads the innermost match', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory(['/campaigns']);
    renderApp(history);
    await user.click(screen.getByRole('button', { name: 'Open c02' }));
    expect(history.location.pathname).toBe('/campaigns/c02');
    expect(
      screen.getByRole('heading', { name: 'Campaign c02' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(history.location.pathname).toBe('/campaigns');
    expect(
      screen.queryByRole('heading', { name: /Campaign c/ }),
    ).not.toBeInTheDocument();
  });

  it('useSearchParams setter navigates (push or replace) and keeps the pathname', async () => {
    const user = userEvent.setup();
    const history = createMemoryHistory(['/campaigns/c01']);
    renderApp(history);
    expect(screen.getByTestId('tab')).toHaveTextContent('none');

    await user.click(screen.getByRole('button', { name: 'Audience tab' }));
    expect(history.location).toEqual({
      pathname: '/campaigns/c01',
      search: '?tab=audience',
      hash: '',
    });
    expect(screen.getByTestId('tab')).toHaveTextContent('audience');

    await user.click(screen.getByRole('button', { name: 'Page 2' })); // functional form + replace
    expect(history.location.search).toBe('?tab=audience&page=2');

    act(() => history.go(-1)); // the replace left only one entry to go back to
    expect(history.location.pathname).toBe('/campaigns/c01');
    expect(history.location.search).toBe('');
  });

  it('hooks throw outside a Router; Outlet renders null when there is no child match', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLocation())).toThrow();
    expect(() => renderHook(() => useNavigate())).toThrow();
    expect(() => renderHook(() => useParams())).toThrow();
    expect(() => renderHook(() => useSearchParams())).toThrow();
    spy.mockRestore();

    const history = createMemoryHistory(['/solo']);
    render(
      <Router history={history}>
        <Routes>
          <Route
            path="solo"
            element={
              <div data-testid="solo">
                solo
                <Outlet />
              </div>
            }
          />
        </Routes>
      </Router>,
    );
    expect(screen.getByTestId('solo')).toHaveTextContent(/^solo$/);
  });
});
