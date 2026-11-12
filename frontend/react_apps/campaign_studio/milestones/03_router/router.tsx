/**
 * Milestone 3 — a small client-side router: history, ranked matching,
 * nested routes with <Outlet>, Link / Navigate, params and search params.
 * See README.md in this folder. Tests: router.test.tsx.
 */
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';

export interface Location {
  /** Always starts with `/`, no trailing slash except for the root. */
  pathname: string;
  /** Starts with `?` or is empty. */
  search: string;
  /** Starts with `#` or is empty. */
  hash: string;
}

export type To = string | Partial<Location>;

export interface NavigateOptions {
  replace?: boolean;
}

export interface History {
  readonly location: Location;
  push(to: To): void;
  replace(to: To): void;
  /** -1 for back, +1 for forward. */
  go(delta: number): void;
  /** Called after every navigation (including `go`). Returns an unsubscribe. */
  listen(listener: (location: Location) => void): () => void;
}

/** In-memory history for tests and non-browser rendering. */
export function createMemoryHistory(
  initialEntries: string[] = ['/'],
  initialIndex?: number,
): History {
  void initialEntries;
  void initialIndex;
  throw new Error('Not implemented');
}

/** History over `window.location.hash` (`#/campaigns/c01?page=2`) — works on any static host. */
export function createHashHistory(): History {
  throw new Error('Not implemented');
}

export interface RouteObject {
  /**
   * Relative to the parent route. Segments: static (`campaigns`), dynamic
   * (`:id`), optional-dynamic (`:id?`), splat (`*`, last segment only).
   * Absent for layout routes that only group children.
   */
  path?: string;
  /** Renders in the parent's Outlet when the parent matches exactly. */
  index?: boolean;
  element?: ReactNode;
  children?: RouteObject[];
}

export interface RouteMatch {
  route: RouteObject;
  /** The portion of the URL this route (and its ancestors) matched, e.g. `/campaigns/c01`. */
  pathname: string;
  /** Params accumulated from the root down to this match. */
  params: Record<string, string>;
}

/**
 * Rank: for each candidate leaf path, score segments as static (10) > dynamic (6)
 * > optional (5) > splat (1); more segments win over fewer at equal score; index
 * routes add 2. Ties resolve in definition order.
 */
export function rankRoutePath(path: string, index?: boolean): number {
  void path;
  void index;
  throw new Error('Not implemented');
}

/**
 * Returns the chain of matches from the root route down to the best leaf, or
 * `null` when nothing matches. Matching is case-sensitive, ignores a trailing
 * slash, and decodes params with `decodeURIComponent`.
 */
export function matchRoutes(
  routes: RouteObject[],
  pathname: string,
): RouteMatch[] | null {
  void routes;
  void pathname;
  throw new Error('Not implemented');
}

/** Builds a pathname from a pattern and params: `generatePath('/c/:id', { id: 'c01' })` → `/c/c01`. */
export function generatePath(
  pattern: string,
  params?: Record<string, string>,
): string {
  void pattern;
  void params;
  throw new Error('Not implemented');
}

export interface RouterProps {
  history: History;
  children: ReactNode;
}

/** Provides the history and the current location to everything below. */
export function Router(props: RouterProps): ReactNode {
  void props;
  throw new Error('Not implemented');
}

export interface RouteProps {
  path?: string;
  index?: boolean;
  element?: ReactNode;
  children?: ReactNode;
}

/** Declarative route; only valid as a child of <Routes> or another <Route>. Renders nothing itself. */
export function Route(props: RouteProps): ReactElement | null {
  void props;
  throw new Error('Not implemented');
}

/** Converts <Route> children into RouteObjects. */
export function createRoutesFromChildren(children: ReactNode): RouteObject[] {
  void children;
  throw new Error('Not implemented');
}

export interface RoutesProps {
  children: ReactNode;
}

/** Renders the element of the best match, nested elements rendering their children via <Outlet>. */
export function Routes(props: RoutesProps): ReactNode {
  void props;
  throw new Error('Not implemented');
}

/** Where a parent route renders the matched child. Renders null when there is none. */
export function Outlet(): ReactNode {
  throw new Error('Not implemented');
}

export interface LinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> {
  to: To;
  replace?: boolean;
}

/**
 * Anchor that navigates through the router. Plain left clicks are intercepted;
 * modified clicks (ctrl/meta/shift/alt) and non-primary buttons fall through to
 * the browser. Sets `aria-current="page"` when `to` matches the current pathname.
 */
export function Link(props: LinkProps): ReactElement {
  void props;
  throw new Error('Not implemented');
}

export interface NavigateProps {
  to: To;
  replace?: boolean;
}

/** Navigates on mount (in an effect) and renders nothing. */
export function Navigate(props: NavigateProps): null {
  void props;
  throw new Error('Not implemented');
}

export function useLocation(): Location {
  throw new Error('Not implemented');
}

/** Params of the innermost match. Throws outside a Router. */
export function useParams<
  T extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >,
>(): T {
  throw new Error('Not implemented');
}

export type NavigateFn = {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
};

export function useNavigate(): NavigateFn {
  throw new Error('Not implemented');
}

export type SetSearchParams = (
  next:
    | URLSearchParams
    | Record<string, string>
    | ((previous: URLSearchParams) => URLSearchParams | Record<string, string>),
  options?: NavigateOptions,
) => void;

/** Like React Router: a URLSearchParams view of `location.search` and a setter that navigates. */
export function useSearchParams(): [URLSearchParams, SetSearchParams] {
  throw new Error('Not implemented');
}
