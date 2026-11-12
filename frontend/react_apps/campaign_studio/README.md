# Campaign Studio

A small internal tool for marketing ops — campaigns, audiences, message
templates, send schedules and multi-step journeys — built as a **multi-evening
practice project**. The shell (milestone 1) is given and working; milestones
2–7 are assignments: typed stubs, a README with the spec, and a jest suite that
fails until you implement them.

The jest suites are the grader. Everything else (the dev server, the
assignment cards, this document) exists so you can see the thing you are
building.

## Run it

From the repo root (React 19, TypeScript 5.7, Vite 8, Jest 29 — no new
dependencies):

```bash
npm run dev:campaign            # Vite dev server, opens the app
npm run test:campaign           # every suite under this folder
npm run test:campaign -- 04_audience   # one milestone
npx tsc --noEmit -p frontend/react_apps/campaign_studio   # type-check
```

Expected state on a fresh checkout: the 3 `shell/*` suites pass (20 tests), the
13 milestone suites fail (85 tests), and every failure message is exactly
`Not implemented`. If a milestone test fails for any other reason before you
have touched the stub, that is a bug in the kit — not in your work.

## Layout

```
campaign_studio/
├── index.html, main.tsx, vite.config.ts, tsconfig.json, styles.css
├── app/
│   ├── App.tsx          shell: header, side nav (useState switch), content
│   ├── Dashboard.tsx    the one working area (plain useEffect, by design)
│   ├── TaskBoundary.tsx error boundary: "Not implemented" → assignment card
│   └── milestones.ts    nav areas ↔ milestone folders
├── shell/               MILESTONE 1 — given, tested, do not need changes
│   ├── types.ts         domain types shared by every milestone
│   ├── store.ts         createStore / useStore (useSyncExternalStore)
│   ├── session.tsx      SessionProvider / useSession: user, role, flags
│   ├── api.ts           in-memory fake backend (latency, seeded failures)
│   ├── fixtures.ts      40 campaigns, 60 customers, 6 templates, 5 blocks, 2 journeys
│   ├── prng.ts          mulberry32
│   └── testing.ts       deferred / flush helpers for the suites
└── milestones/
    ├── 02_data_layer/   lru.ts, query.ts, CampaignsPage.tsx
    ├── 03_router/       router.tsx
    ├── 04_audience/     rules.ts, SegmentBuilder.tsx
    ├── 05_content/      template.ts, TemplateEditor.tsx
    ├── 06_schedule/     schedule.ts, SchedulePicker.tsx
    └── 07_journey/      graph.ts, events.ts, JourneyBuilder.tsx
```

Each milestone folder has its own `README.md` (scenario, numbered
requirements, acceptance criteria, a11y baseline, interviewer follow-ups) and
`*.test.ts(x)` files. The stubs carry the full type contract and doc comments;
every function body is `throw new Error('Not implemented')`.

## How the shell behaves

- The left nav switches areas with `useState`. Each area that belongs to a
  milestone renders inside `TaskBoundary`: a render that throws
  `Not implemented` shows an assignment card (title, link to the README, the
  jest command); any other error shows a crash card with a Retry button.
- `SessionProvider` wraps the app. The header lets you switch the user's role
  between `editor` and `approver`; the Dashboard exposes the feature flags.
  Milestone components read both through `useSession()` / `useFlag()`.
- `shell/api.ts` exports one shared instance (`api`, 350 ms latency) used by
  the app, and `createApi(options)` for tests (`latencyMs`, `failureRate`,
  `seed`; `calls` counters; `reset()`).

## The milestones

### 01 — Shell (given)

A tiny external store with batching and selector isolation, a session context
built on it, and a deterministic fake backend. Read these three files before
starting: every later milestone consumes them, and the store is the pattern
the query client and router will reuse (`useSyncExternalStore` with a cached
snapshot).

What good looks like: you can explain why `useStore` memoises the selected
value per state reference, why `batch` notifies once and only when something
changed, and why the API draws its failure before the timer fires.

### 02 — Data layer: LRU cache + query client (`Campaigns` tab)

Build `createLruCache` (max, TTL, `getOrLoad` de-dupe) and a miniature React
Query: a client cache with observers, `useQuery` with
stale-while-revalidate and a stale-response guard, `useMutation` with
`onMutate`/`onError` for optimistic writes, `invalidateQueries` /
`setQueryData`. Then build `CampaignsPage` on top of it: a paginated, filtered,
sortable table that lets an approver approve pending campaigns optimistically
and rolls back on failure.

What good looks like:

- [ ] Two components with the same key cause one request; a key change
      mid-flight never shows the old key's response.
- [ ] Cached data renders synchronously; background refetch is visible only
      through `isFetching`.
- [ ] Optimistic approve flips rows instantly, rolls back and shows an alert
      when the API rejects.
- [ ] No state update after unmount (no `console.error` in tests).
- [ ] `CampaignsPage` talks to the API only through `useQuery`/`useMutation`.

### 03 — Router (`app/App.tsx`)

A history abstraction (memory + hash), `matchRoutes` with path ranking
(static > dynamic > optional > splat), nested `Routes`/`Route`/`Outlet`,
`Link` with correct modified-click behaviour, `Navigate`, and the hooks
`useParams`/`useNavigate`/`useLocation`/`useSearchParams`. When it is green,
swap the shell's `useState` nav for the router — the exact steps are in
`milestones/03_router/README.md` ("How it plugs into the app"). The App ships
on the `useState` nav so the shell works before this milestone.

What good looks like:

- [ ] `matchRoutes` returns the root→leaf chain with accumulated params and is
      deterministic on ties (definition order).
- [ ] Nested layouts render children through `Outlet`; index routes work.
- [ ] `Link` sets `aria-current="page"` and lets cmd/ctrl-click open a tab.
- [ ] `useSearchParams` setter keeps the pathname and supports `replace`.
- [ ] The URL carries the app state after the swap (`#/campaigns/c07` reloads
      to the same screen).

### 04 — Audience rules + segment builder (`Audiences` tab)

A nested AND/OR/NOT rule tree evaluated against customers (`evaluate`), a
normaliser (`simplify`) that flattens, dedupes and unwraps without changing
meaning, `countMatches`/`matchingIds`, and linear-time `intersect` / `union` /
`difference` over sorted id lists. `SegmentBuilder` is a recursive editor
with a live `N of 60 customers match` count over `listCustomers()`.

What good looks like:

- [ ] Every operator family has a test and null/missing values are handled
      explicitly, not by accident.
- [ ] `simplify` never mutates its input and the root stays a group.
- [ ] Set operations are single-pass merges, not `includes` loops.
- [ ] The editor is one recursive component; the count is derived state, not
      a second source of truth.

### 05 — Templates: tokenizer, renderer, editor (`Templates` tab)

A hand-written tokenizer for `{{name}}`, `{{name | fallback}}`,
`{{block:id}}` and the `\{{` escape that recovers from malformed tags with
error tokens; a renderer that expands CMS blocks recursively with a depth
guard and reports problems (`missing_var`, `missing_block`, `cycle`,
`syntax`); an SMS counter (GSM-7 vs UCS-2 segmentation). `TemplateEditor`
shows a live preview, a problems alert, an insert-block select and the SMS
counter for SMS templates.

What good looks like:

- [ ] One pass over the source; no regex-with-global-state surprises.
- [ ] Problems are reported in source order with the raw tag text.
- [ ] A self-referencing block terminates with a `cycle` problem, not a stack
      overflow.
- [ ] Preview, problems and counter all derive from the same render call.

### 06 — Scheduling: quiet hours + recurrence (`Schedule` tab)

Minutes-of-week arithmetic: `normalizeQuietHours` (merge, sort, split at
midnight and at the week boundary), `isQuiet` by binary search, `nextAllowed`,
and `nextSends` that expands daily/weekly recurrence in an IANA timezone using
only `Intl.DateTimeFormat` — including the DST gap and overlap.
`SchedulePicker` is a controlled form with a "Next sends" preview.

What good looks like:

- [ ] `zonedTimeToUtc` round-trips and has a stated policy for non-existent
      and ambiguous local times.
- [ ] Weekly sends in `America/New_York` keep their local time across the
      November change (the UTC instant shifts by an hour).
- [ ] Quiet-hour pushes land on the next allowed minute of the same week and
      duplicates collapse.
- [ ] The preview is deterministic because `now` is injected.

### 07 — Journeys: graph validation + event log (`Journeys` tab)

`topoOrder` (Kahn, deterministic), `findCycle`, `unreachable`, and
`validateJourney` with a documented issue order; an event-sourced run log
(`apply` immutable and idempotent by `eventId`, `rebuild` from events or from
a `snapshot`); and `JourneyBuilder`: an outline editor with a live validation
alert, an add-node form, a save button and a simulator that walks fixture
customers through the graph.

What good looks like:

- [ ] `apply` returns the same reference for a duplicate event.
- [ ] `rebuild(events)` equals `rebuild(rest, snapshot(mid))`.
- [ ] Validation lists every problem, in order, and the alert updates as you
      edit.
- [ ] Simulate is disabled while the journey is invalid.

## Working rules

- Tests are the grader. Read the README, then the test file, then write the
  code. If a test and a README disagree, the test wins — and please fix the
  README.
- Do not change exported names, props or types in the stubs; `app/App.tsx`
  imports them. Adding exports is fine.
- No new dependencies. React + TypeScript + the DOM.
- Keep each milestone's work in its folder; shared changes belong in
  `shell/` only when a later milestone genuinely needs them.
- Commit per milestone when the suite is green so you can diff your own
  approach against a second attempt later.
