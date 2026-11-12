# Milestone 03. Router — Ranked Matching, Nested Outlets, Links

**Difficulty:** Hard
**Estimated time:** 2 evenings
**Topics:** History Abstraction, Path Ranking, Nested Routes, Context, `useSyncExternalStore`, Progressive Enhancement of Links

---

## Scenario

Campaign Studio's left nav is a `useState` switch: a reload drops you back on
the Dashboard, you cannot send a colleague a link to campaign `c07`, and the
browser Back button does nothing. Ops want shareable URLs for every area
(`#/campaigns/c07?tab=stats`), nested layouts (the campaign detail opens inside
the campaigns list), and the usual link behaviour: plain click navigates
in-app, ⌘-click still opens a new tab.

Build a small client-side router in one file — a history abstraction, ranked
route matching with params and nested `<Outlet>`s, `<Link>` / `<Navigate>`,
and the hooks — then swap the shell over to it.

## Requirements

### History

1. `createMemoryHistory(entries = ['/'], index?)`: `location` is the current
   entry parsed into `{ pathname, search, hash }` (`pathname` starts with `/`,
   no trailing slash except root; `search`/`hash` keep their `?`/`#` or are
   empty). `push` truncates forward entries and appends; `replace` swaps the
   current entry; `go(delta)` clamps to the valid range. Every navigation
   notifies `listen` subscribers with the new location; the returned function
   unsubscribes. `To` is a string (`/a?x=1#h`) or a partial location.
2. `createHashHistory()`: same interface over `window.location.hash`
   (`#/campaigns/c01?page=2`), notified by the `hashchange` event; `go`
   delegates to `window.history.go`. Return the same `Location` object while
   the hash is unchanged (snapshot stability).

### Matching

3. `rankRoutePath(path, index?)`: sum per segment — static 10, dynamic `:id`
   6, optional `:id?` 5, splat `*` 1 — plus 2 for an index route. More
   segments therefore outrank fewer at equal kind.
4. `matchRoutes(routes, pathname)` returns the chain of `RouteMatch`es from
   the root route to the best leaf, or `null`. Flatten every route (a parent
   with children is itself a candidate leaf, so `/campaigns` matches the
   `campaigns` route alone), rank candidates by score then definition order,
   and take the first whose full pattern consumes the whole pathname.
   Trailing slashes are ignored, matching is case-sensitive, params are
   `decodeURIComponent`-ed, the splat value is stored under `params['*']`.
   Each level's `pathname` is the URL prefix matched so far; `params`
   accumulate root → leaf. An index route matches when the parent matches
   exactly.
5. `generatePath(pattern, params)` fills `:id` (throws naming the missing
   param), drops a missing `:id?`, URL-encodes values and inserts `*` raw.
6. `createRoutesFromChildren(children)` converts `<Route>` elements (and
   fragments of them) into `RouteObject`s recursively. `<Route>` itself renders
   nothing — it is configuration.

### Components and hooks

7. `<Router history>` provides the history and current location
   (`useSyncExternalStore` over `history.listen`, so a `<Navigate>` that fires
   before the subscription is registered is still seen).
8. `<Routes>` renders the matched chain: the root match's `element`, whose
   `<Outlet>` renders the next match, and so on. A route without `element`
   behaves as a bare `<Outlet>`. No match renders nothing; an `<Outlet>` with
   no child match renders `null`.
9. `<Link to replace?>` renders an `<a href>`; plain left clicks are
   intercepted (`preventDefault` + navigate); clicks with meta/ctrl/shift/alt,
   non-primary buttons, a `target` other than `_self`, or an already
   `defaultPrevented` event fall through to the browser. `aria-current="page"`
   when `to`'s pathname equals the current pathname.
10. `<Navigate to replace?>` navigates once on mount (in an effect) and
    renders `null`.
11. `useLocation`, `useParams` (innermost match; `{}` inside `Router` but
    outside a match), `useNavigate` (`navigate(to, { replace })` or
    `navigate(-1)`), `useSearchParams` (a `URLSearchParams` view of
    `location.search` plus a setter that accepts a `URLSearchParams`, a record
    or an updater, navigates with push or `{ replace: true }`, and keeps the
    pathname). Every hook throws outside `<Router>`.

## Acceptance Criteria

- [ ] Memory history: parsing, push/replace/go with clamping, listen order,
      unsubscribe.
- [ ] `rankRoutePath` ordering and the index bonus.
- [ ] `/campaigns/new` beats `campaigns/:id`; `:id` beats `*`; splat captures
      the rest; unmatched → `null`.
- [ ] Index route at `/`; optional param present/absent; trailing slash;
      `%20` decoded; per-level `pathname` and accumulated params.
- [ ] `generatePath` encodes, drops optionals, throws on a missing required
      param.
- [ ] `createRoutesFromChildren` preserves nesting and `index`.
- [ ] Nested rendering through `<Outlet>` including index and 404 branches.
- [ ] `<Link>`: navigation, `aria-current`, modified/right clicks not
      prevented.
- [ ] `<Navigate replace>` leaves no extra history entry.
- [ ] `useNavigate` with a path and with `-1`; `useParams` reads `:id`.
- [ ] `useSearchParams` setter: record form (push), updater form with
      `replace`, pathname kept.
- [ ] Hooks throw outside `<Router>`; empty `<Outlet>` renders `null`.

## Baseline a11y

- Links are real `<a href>` elements (middle-click, copy link and "open in
  new tab" keep working); the active one carries `aria-current="page"`.
- Navigation never steals focus; the layout decides where focus goes.
- No `onClick` on non-interactive elements — programmatic navigation lives
  behind real `<button>`s.

## Constraints

- React + TypeScript only. No new dependencies, no `react-router`.
- Do not change exported names or signatures in `router.tsx`.
- Rendering must be pure: no module-level mutable state, so several `Router`s
  can coexist in one test file.
- Tests are the grader: `npm run test:campaign -- 03_router`.

## How it plugs into the app

`app/App.tsx` deliberately still uses the `useState` tab switch so the shell
works before this milestone. When your tests are green, do the swap:

1. In `app/App.tsx` create the history once at module level:
   `const history = createHashHistory();` (hash routing works on any static
   host and under Vite's dev server without a fallback).
2. Replace the `Shell`'s `current`/`setCurrent` state with routes:

   ```tsx
   <Router history={history}>
     <Routes>
       <Route path="/" element={<Layout />}>
         <Route index element={<Dashboard />} />
         <Route path="campaigns" element={<CampaignsArea />}>
           <Route path=":id" element={<CampaignDetailPanel />} />
         </Route>
         <Route path="audiences" element={<SegmentBuilder />} />
         <Route path="templates/:id?" element={<TemplateArea />} />
         <Route path="schedule" element={<ScheduleArea />} />
         <Route path="journeys/:id?" element={<JourneyArea />} />
         <Route path="*" element={<Navigate to="/" replace />} />
       </Route>
     </Routes>
   </Router>
   ```

   `Layout` renders the `Header`, the side nav and `<main><Outlet /></main>`.
   Keep each milestone component inside its `TaskBoundary` (key it by the
   route pathname so the boundary resets on navigation). `TemplateArea` /
   `JourneyArea` read `useParams().id` and pass it as `templateId` /
   `journeyId`; `CampaignsPage` can read `useSearchParams()` for `page` and
   `status` so filters become shareable URLs.
3. Turn the nav `<button>`s into `<Link to="/campaigns">`s; the router sets
   `aria-current="page"` for you — delete the manual `className="active"`
   logic and style `a[aria-current="page"]` instead.
4. `Dashboard`'s "Milestones" list can link to each area with `<Link>`.

The URL now carries the state: `#/campaigns/c07?tab=stats` reloads to the same
screen and the browser Back button works.

## Interviewer follow-ups (talk-through, not implemented)

- Data loading per route (`loader` functions): how do you start the fetch
  when the URL changes *before* the component renders, and share the result
  with milestone 2's query cache?
- Route transitions: wrap navigation in `startTransition` so the old screen
  stays interactive while the new one suspends — what changes in `Router`?
- Scroll restoration: where do you record the scroll position for each
  history entry, and how do you key it (`location.key`)?
- Relative links (`to="../"`) and relative routes — what does the resolution
  algorithm need from the route context?
- Blocking navigation with unsaved changes (`useBlocker`): how does a
  memory/hash history support "cancel this navigation"?

## Say out loud

- Separate *matching* (pure: routes + pathname → match chain) from
  *rendering* (context + Outlet). The pure half gets the bulk of the tests.
- Ranking is computed on the flattened full path, not per route object; a
  parent with children is also a leaf candidate so `/campaigns` matches.
- Name the hazard: `<Navigate>` fires in a child effect before `<Router>`'s
  own subscription effect — `useSyncExternalStore` re-checks the snapshot
  after subscribing, which is why it is the right primitive here.
- Ask one question: "Hash or browser history for the deployment target? With
  `pushState` we need a server fallback to `index.html`."
- Name the first test: "`/campaigns/new` beats `campaigns/:id` even when
  defined after it."
