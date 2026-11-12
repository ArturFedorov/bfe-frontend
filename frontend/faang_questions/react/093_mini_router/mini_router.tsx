import { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';

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

/**
 * Match `pathname` against a route tree. Returns the matched branch from root
 * to leaf, or `null`. Ranking: static segments beat params beat `*`, and a
 * longer (more specific) match beats a shorter one; ties keep definition order.
 */
export function matchRoutes(_routes: RouteObject[], _pathname: string): RouteMatch[] | null {
  throw new Error('Not implemented');
}

/** Owns the location: reads `window.location`, listens to `popstate`, exposes `navigate`. */
export function Router(_props: RouterProps): ReactElement {
  throw new Error('Not implemented');
}

/** Picks the best-ranked branch for the current pathname and renders it (parents wrap children via `Outlet`). */
export function Routes(_props: RoutesProps): ReactElement | null {
  throw new Error('Not implemented');
}

/** Declarative route config; renders nothing by itself. */
export function Route(_props: RouteProps): ReactElement | null {
  throw new Error('Not implemented');
}

/** Where a parent route renders its matched child. */
export function Outlet(): ReactElement | null {
  throw new Error('Not implemented');
}

/** Accessible `<a href>` that navigates client-side on a plain left click. */
export function Link(_props: LinkProps): ReactElement {
  throw new Error('Not implemented');
}

/** Redirects on mount (and whenever `to` changes). */
export function Navigate(_props: NavigateProps): null {
  throw new Error('Not implemented');
}

/** Renders `children` when authenticated; otherwise redirects (replace) with `state.from` set to the current location. */
export function RequireAuth(_props: RequireAuthProps): ReactElement {
  throw new Error('Not implemented');
}

export function useLocation(): Location {
  throw new Error('Not implemented');
}

export function useNavigate(): NavigateFunction {
  throw new Error('Not implemented');
}

/** Params of the current route branch (`{}` outside a match). */
export function useParams(): Params {
  throw new Error('Not implemented');
}

export function useSearchParams(): [URLSearchParams, SetSearchParams] {
  throw new Error('Not implemented');
}
