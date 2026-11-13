import {
  AnchorHTMLAttributes,
  Children,
  createContext,
  Fragment,
  isValidElement,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type Params = Record<string, string>;

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  /** `history.state` of the current entry (whatever `navigate` stored); `null` for fresh loads. */
  state: unknown;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

export interface NavigateFunction {
  (to: string, options?: NavigateOptions): void;
  /** `navigate(-1)` goes back, `navigate(1)` forward (delegates to `history.go`). */
  (delta: number): void;
}

/** Route config in object form — what `matchRoutes` consumes and what `<Route>` elements compile to. */
export interface RouteObject {
  /** Relative to the parent route. `:id` is a param, a final `*` captures the rest under `params['*']`. */
  path?: string;
  /** Renders at the parent's path exactly (child of a layout route). */
  index?: boolean;
  element?: ReactNode;
  children?: RouteObject[];
}

export interface RouteMatch {
  route: RouteObject;
  /** Absolute pathname portion matched by this route and its ancestors. */
  pathname: string;
  /** All params of the whole branch (parents see their children's params too). */
  params: Params;
}

export interface RouterProps {
  children?: ReactNode;
}

export interface RoutesProps {
  children?: ReactNode;
}

export interface RouteProps {
  path?: string;
  index?: boolean;
  element?: ReactNode;
  children?: ReactNode;
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
  state?: unknown;
  children?: ReactNode;
}

export interface NavigateProps {
  to: string;
  replace?: boolean;
  state?: unknown;
}

export interface RequireAuthProps {
  isAuthenticated: boolean;
  /** Where to send anonymous users, e.g. `/login`. */
  redirectTo: string;
  children: ReactNode;
}

export type SearchParamsInit = URLSearchParams | Record<string, string> | string;

export type SetSearchParams = (
  next: SearchParamsInit | ((previous: URLSearchParams) => SearchParamsInit),
  options?: { replace?: boolean },
) => void;

/* -------------------------------------------------------------------------- */
/* matchRoutes (pure)                                                         */
/* -------------------------------------------------------------------------- */

/** `/campaigns//42/` → `['campaigns', '42']` — leading, trailing and doubled slashes are ignored. */
function splitSegments(path: string): string[] {
  return path.split('/').filter((segment) => segment.length > 0);
}

interface BranchLevel {
  route: RouteObject;
  /** Pattern segments this level contributes (an index route contributes none). */
  segments: string[];
}

/** One root→leaf path through the route tree, with its ranking score. */
interface Branch {
  levels: BranchLevel[];
  /** All pattern segments of the branch, root first. */
  segments: string[];
  score: number;
}

const STATIC_SEGMENT_SCORE = 10;
const PARAM_SEGMENT_SCORE = 3;
const INDEX_ROUTE_BONUS = 2;
const SPLAT_PENALTY = -2;

/**
 * Rank a full pattern. More segments → higher base score (longer branches win);
 * static segments are worth more than params; a trailing `*` is penalised and
 * an index route gets a small bonus so it beats its bare layout parent.
 */
function scoreBranch(segments: string[], isIndex: boolean): number {
  const hasSplat = segments[segments.length - 1] === '*';
  const concrete = hasSplat ? segments.slice(0, -1) : segments;
  let score = concrete.length + (hasSplat ? SPLAT_PENALTY : 0) + (isIndex ? INDEX_ROUTE_BONUS : 0);
  for (const segment of concrete) score += segment.startsWith(':') ? PARAM_SEGMENT_SCORE : STATIC_SEGMENT_SCORE;
  return score;
}

/** Depth-first flatten of the route tree into ranked branches, preserving definition order for ties. */
function flattenRoutes(routes: RouteObject[], parents: BranchLevel[] = [], out: Branch[] = []): Branch[] {
  for (const route of routes) {
    const level: BranchLevel = { route, segments: splitSegments(route.path ?? '') };
    const levels = [...parents, level];
    if (route.children?.length) flattenRoutes(route.children, levels, out);
    // A route only forms a branch of its own when it is addressable (has a path
    // or is an index route); a pathless layout just groups its children.
    if (route.path !== undefined || route.index) {
      const segments = levels.flatMap((l) => l.segments);
      out.push({ levels, segments, score: scoreBranch(segments, Boolean(route.index)) });
    }
  }
  return out;
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Match a whole branch pattern against the pathname segments; `null` when it does not fit exactly. */
function matchSegments(pattern: string[], path: string[]): Params | null {
  const hasSplat = pattern[pattern.length - 1] === '*';
  const concrete = hasSplat ? pattern.slice(0, -1) : pattern;
  if (path.length < concrete.length) return null;
  if (!hasSplat && path.length !== concrete.length) return null;

  const params: Params = {};
  for (let i = 0; i < concrete.length; i++) {
    const expected = concrete[i];
    if (expected.startsWith(':')) params[expected.slice(1)] = safeDecode(path[i]);
    else if (expected !== path[i]) return null;
  }
  if (hasSplat) params['*'] = path.slice(concrete.length).map(safeDecode).join('/');
  return params;
}

/**
 * Match `pathname` against a route tree. Returns the matched branch from root
 * to leaf, or `null`. Ranking: static segments beat params beat `*`, and a
 * longer (more specific) match beats a shorter one; ties keep definition order.
 */
export function matchRoutes(routes: RouteObject[], pathname: string): RouteMatch[] | null {
  const path = splitSegments(pathname);
  // Array.prototype.sort is stable, so equal scores keep definition (DFS) order.
  const branches = flattenRoutes(routes).sort((a, b) => b.score - a.score);

  for (const branch of branches) {
    const params = matchSegments(branch.segments, path);
    if (!params) continue;

    // Per-level pathname: the path consumed by this level and its ancestors.
    let consumed = 0;
    return branch.levels.map((level) => {
      const isSplatLevel = level.segments[level.segments.length - 1] === '*';
      consumed += isSplatLevel ? level.segments.length - 1 : level.segments.length;
      const matchedPath = isSplatLevel ? path : path.slice(0, consumed);
      return { route: level.route, pathname: `/${matchedPath.join('/')}`, params };
    });
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Router: owns the location                                                  */
/* -------------------------------------------------------------------------- */

interface RouterContextValue {
  location: Location;
  navigate: NavigateFunction;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function useRouterContext(hook: string): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error(`${hook} must be used inside a <Router>`);
  return ctx;
}

/** The only place `window.location` / `history.state` are read. */
function readWindowLocation(): Location {
  const { pathname, search, hash } = window.location;
  return { pathname, search, hash, state: window.history.state ?? null };
}

/** Owns the location: reads `window.location`, listens to `popstate`, exposes `navigate`. */
export function Router({ children }: RouterProps): ReactElement {
  const [location, setLocation] = useState<Location>(readWindowLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readWindowLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Stable: depends only on the stable `setLocation`.
  const navigate = useCallback<NavigateFunction>((to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return; // the resulting popstate updates the location
    }
    const url = new URL(to, window.location.href); // resolve relative `to` against the current URL
    const state = options?.state ?? null;
    const href = url.pathname + url.search + url.hash;
    if (options?.replace) window.history.replaceState(state, '', href);
    else window.history.pushState(state, '', href);
    setLocation({ pathname: url.pathname, search: url.search, hash: url.hash, state });
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/* Routes / Route / Outlet                                                    */
/* -------------------------------------------------------------------------- */

interface RouteContextValue {
  /** The branch from the root down to (and including) this level. */
  matches: RouteMatch[];
  /** The rendered child level, shown wherever this level places `<Outlet />`. */
  outlet: ReactElement | null;
}

const RouteContext = createContext<RouteContextValue | null>(null);

/** Compile `<Route>` elements (recursively, fragments allowed) into plain `RouteObject`s. */
function createRoutesFromChildren(children: ReactNode): RouteObject[] {
  const routes: RouteObject[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      routes.push(...createRoutesFromChildren((child as ReactElement<{ children?: ReactNode }>).props.children));
      return;
    }
    const { path, index, element, children: nested } = (child as ReactElement<RouteProps>).props;
    const route: RouteObject = { path, index, element };
    if (nested) route.children = createRoutesFromChildren(nested);
    routes.push(route);
  });
  return routes;
}

/** Picks the best-ranked branch for the current pathname and renders it (parents wrap children via `Outlet`). */
export function Routes({ children }: RoutesProps): ReactElement | null {
  const { location } = useRouterContext('Routes');
  const routes = createRoutesFromChildren(children);
  const matches = matchRoutes(routes, location.pathname);
  if (!matches) return null;

  // Build leaf → root: each level's provider carries the already-built child as its `outlet`.
  return matches.reduceRight<ReactElement | null>((outlet, match, index) => {
    const value: RouteContextValue = { matches: matches.slice(0, index + 1), outlet };
    return (
      <RouteContext.Provider value={value}>
        {match.route.element === undefined ? <Outlet /> : match.route.element}
      </RouteContext.Provider>
    );
  }, null);
}

/** Declarative route config; renders nothing by itself. */
export function Route(_props: RouteProps): ReactElement | null {
  return null;
}

/** Where a parent route renders its matched child. */
export function Outlet(): ReactElement | null {
  return useContext(RouteContext)?.outlet ?? null;
}

/* -------------------------------------------------------------------------- */
/* Link / Navigate / RequireAuth                                              */
/* -------------------------------------------------------------------------- */

function isModifiedEvent(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/** Accessible `<a href>` that navigates client-side on a plain left click. */
export function Link({ to, replace, state, onClick, target, children, ...rest }: LinkProps): ReactElement {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented || // the consumer handled it
      event.button !== 0 || // middle / right click
      (target && target !== '_self') || // new tab / named window
      isModifiedEvent(event) // open in new tab/window
    ) {
      return; // let the browser do its thing
    }
    event.preventDefault();
    navigate(to, { replace, state });
  };

  return (
    <a {...rest} href={to} target={target} onClick={handleClick}>
      {children}
    </a>
  );
}

/** Redirects on mount (and whenever `to` changes). */
export function Navigate({ to, replace, state }: NavigateProps): null {
  const navigate = useNavigate();
  // `state` is often an inline object; keep the latest options in a ref so a
  // new identity every render does not re-trigger the redirect.
  const optionsRef = useRef({ replace, state });
  useEffect(() => {
    optionsRef.current = { replace, state };
  });

  // In an effect, never during render: writing history mid-render is a side effect.
  useEffect(() => {
    navigate(to, optionsRef.current);
  }, [navigate, to]);

  return null;
}

/** Renders `children` when authenticated; otherwise redirects (replace) with `state.from` set to the current location. */
export function RequireAuth({ isAuthenticated, redirectTo, children }: RequireAuthProps): ReactElement {
  const location = useLocation();
  if (isAuthenticated) return <>{children}</>;
  return <Navigate to={redirectTo} replace state={{ from: location }} />;
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useLocation(): Location {
  return useRouterContext('useLocation').location;
}

export function useNavigate(): NavigateFunction {
  return useRouterContext('useNavigate').navigate;
}

const EMPTY_PARAMS: Params = {};

/** Params of the current route branch (`{}` outside a match). */
export function useParams(): Params {
  const ctx = useContext(RouteContext);
  // Every match in the branch carries the full params, so the deepest level is fine.
  return ctx?.matches[ctx.matches.length - 1]?.params ?? EMPTY_PARAMS;
}

export function useSearchParams(): [URLSearchParams, SetSearchParams] {
  const { location, navigate } = useRouterContext('useSearchParams');
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const setSearchParams = useCallback<SetSearchParams>(
    (next, options) => {
      const init = typeof next === 'function' ? next(new URLSearchParams(location.search)) : next;
      const query = new URLSearchParams(init).toString();
      // Same pathname (and hash), new query; `replace` keeps history.length unchanged.
      navigate(`${location.pathname}${query ? `?${query}` : ''}${location.hash}`, { replace: options?.replace });
    },
    [location.pathname, location.search, location.hash, navigate],
  );

  return [searchParams, setSearchParams];
}
