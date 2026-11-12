# 093. Mini Router

**Difficulty:** Hard
**Estimated time:** 60 minutes
**Topics:** History API, Route Matching and Ranking, Context Composition, Nested Rendering, Redirect Flows

---

## Scenario

The campaign console grew from a single page into campaigns, audiences,
templates and an approvals queue, all stitched together with hand-written
`window.location` checks. Deep links break, the Back button does nothing, and
anonymous users who hit `/approvals` lose the page they came from after
signing in. Build a small client-side router: declarative nested routes,
params, a catch-all, accessible links, search-param state, and an auth gate
that returns users to where they were.

Everything lives in `mini_router.tsx`. `matchRoutes` is a pure function that
the UI uses and the tests exercise on its own.

## Requirements

1. `matchRoutes(routes, pathname)` returns the matched branch root → leaf
   (`RouteMatch[]`) or `null`. Child `path`s are relative to the parent;
   `:name` segments become `params[name]` (URL-decoded); a final `*`
   captures the remainder under `params['*']` (may be empty). A trailing
   slash in the pathname is ignored. `index: true` children match the parent
   path exactly. Every match in the branch carries the full `params`.
2. Ranking: static segments beat params beat `*`; a longer (more specific)
   branch beats a shorter one; ties keep definition order. Definition order
   must not otherwise matter (`/campaigns/:id` declared before
   `/campaigns/new` still loses for `/campaigns/new`).
3. `<Router>` reads `window.location` (`pathname`, `search`, `hash`,
   `history.state`) on mount, listens to `popstate` and removes the listener
   on unmount. Everything below it reads the location from context — never
   from `window` during render.
4. `<Routes>` compiles its `<Route>` children (recursively) into
   `RouteObject[]`, matches the current pathname and renders the branch with
   each parent wrapping its child; a parent's `element` renders the child via
   `<Outlet />`. A parent without `element` renders just the outlet. No match
   renders nothing.
5. `<Link to replace? state?>` renders a real `<a href={to}>`; a plain left
   click calls `preventDefault` and `pushState` (`replaceState` when
   `replace`). Clicks with `metaKey`/`ctrlKey`/`shiftKey`/`altKey`, a
   non-primary button, a `target` other than `_self`, or an already
   `defaultPrevented` event are left to the browser.
6. `useNavigate()` returns a stable `navigate(to, { replace?, state? })` that
   resolves `to` against the current URL, writes history, and stores `state`
   as `history.state`; `navigate(delta: number)` calls `history.go(delta)`.
7. `useLocation()`, `useParams()` and
   `useSearchParams(): [URLSearchParams, setSearchParams]` reflect the
   current entry. `setSearchParams(next | prev => next, { replace? })`
   keeps the pathname, replaces the query, and uses `replaceState` only when
   `replace` is set (so a filter change does not grow `history.length`).
8. `<Navigate to replace? state?>` navigates in an effect on mount. A route
   whose element is `<Navigate replace>` must not leave the original entry in
   history.
9. `<RequireAuth isAuthenticated redirectTo>` renders `children` when
   authenticated; otherwise renders `<Navigate replace>` to `redirectTo` with
   `state = { from: currentLocation }` so the login page can link back to
   `from.pathname + from.search`. Flipping `isAuthenticated` at runtime swaps
   the rendering without remounting the Router.
10. Back/Forward: a `popstate` event re-renders from the new URL in either
    direction, including search params and nested routes.

## Acceptance Criteria

- [ ] `matchRoutes`: params extracted, nested branch returned with per-level
      `pathname`, trailing slash tolerated, `null` when nothing matches.
- [ ] Ranking: `/campaigns/new` → static route; `/campaigns/newer` → `:id`;
      `/campaigns` → index child; `/` → home; order of declaration irrelevant.
- [ ] `*` captures `'vip/members'` / `'reports/weekly'`; the top-level `*`
      only wins when nothing else matches.
- [ ] Initial render at `/campaigns/42?status=draft` shows the layout heading,
      the detail article and the parsed `status` param.
- [ ] Index child at `/campaigns`; catch-all heading for `/reports/weekly`.
- [ ] Link click: `href` attribute present, `history.length + 1`, URL and
      rendering updated; `replace` link keeps `history.length`.
- [ ] Modified / middle clicks: URL, history and rendering unchanged.
- [ ] `popstate` to a previous URL re-renders it; to a later URL re-renders
      that (Back then Forward then Back twice).
- [ ] `navigate('/campaigns/99', { state })` pushes with `history.state`;
      `navigate(-1)` calls `history.go(-1)`.
- [ ] `setSearchParams(..., { replace: true })` keeps `history.length`;
      without `replace` it grows by one; pathname preserved both ways.
- [ ] `/legacy` → `<Navigate replace>` → `/campaigns`, same `history.length`.
- [ ] Anonymous `/approvals?tab=pending` → `/login` by replace, with
      `history.state.from.pathname === '/approvals'` and a Continue link back
      to `/approvals?tab=pending`.
- [ ] Authenticated → Approvals; signing out in place → Sign in with
      `from: /approvals`.

## Baseline a11y

- `Link` must render a genuine `<a href>` so it is focusable, shows the URL
  on hover, and works with Enter, middle-click and "open in new tab".
- Buttons that navigate (`navigate(...)`) are real `<button type="button">`.
- Route changes must not steal or trap focus in this task (follow-up below).

## Constraints

- React + TypeScript only; no third-party libraries.
- Use the History API directly (`pushState`, `replaceState`, `go`,
  `popstate`). No hash routing.
- Do not change the exported types or signatures. Keep `matchRoutes` pure
  (no `window` access).
- Only `<Router>` may read `window.location`/`history.state`, and only on
  mount, in the `popstate` handler and inside `navigate`.

## Interviewer follow-ups (talk-through, not implemented)

- Focus management and announcements on navigation: where would you move
  focus and how would you announce the new page title to screen readers?
- Data loading per route (`loader`) and a pending UI with `useTransition`:
  which part of the matching result becomes the key for the data cache?
- Scroll restoration on Back: where do you store scroll positions (keyed by
  `history.state.key`) and when do you restore them?
- Relative links (`<Link to="messages">` inside `/campaigns/:id`): how does
  `RouteMatch.pathname` help resolve them?

## Say out loud

- State shape first: `Location = { pathname, search, hash, state }` owned by
  `Router`; `RouteContext = { matches, outlet }` per rendered level so
  `useParams` and `Outlet` read their own depth.
- Name the race/cleanup hazard: the `popstate` listener must be removed on
  unmount, and `Navigate` must run in an effect (not during render) so a
  redirect never updates history while React is rendering.
- Ask one data-shape question: "Should `params` be URL-decoded, and may a
  `:id` segment contain encoded slashes?"
- Ask one failure-handling question: "If `to` is an absolute URL to another
  origin, do we let the browser navigate or treat it as a bug?"
- Name the first test you'd write: "`matchRoutes` picks `/campaigns/new`
  over `/campaigns/:id` regardless of declaration order."
