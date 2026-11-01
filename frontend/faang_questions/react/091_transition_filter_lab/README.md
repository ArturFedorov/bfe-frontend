# 091. Transition Filter Lab

**Difficulty:** Medium
**Estimated time:** 60 min
**Topics:** useDeferredValue, useTransition, concurrent rendering, React.memo, urgent vs. non-urgent updates

---

## Scenario

The annotation platform's dataset browser lists 10,000 utterances with a type-to-filter input.
Annotators complain that the input "eats keystrokes": each character triggers a full filter and
a 10k-row list render before the next character can be shown. A previous fix debounced the
input, which made the text appear with a delay instead — equally unpleasant.

Build `<FilterLab />` so the input updates urgently on every keystroke while the expensive list
filtering is deferred with React's concurrent features, show a pending indicator while the list
lags, and prove with tests that stale intermediate renders are discarded.

## Requirements

1. Export a pure `filterItems(items, query)`: case-insensitive substring match; empty query
   returns a copy of all items; never mutates the input array.
2. `<FilterLab items onListRender? />` renders a text input labelled `Filter` and a results
   block: a `<p>` reading `N matches` (the real total) and a `role="list"` named `Results`
   containing at most 50 `listitem`s (one per matching item, in input order).
3. The input is a controlled input whose value updates **urgently** on every keystroke.
4. The list uses the **deferred** query (`useDeferredValue`) or is updated inside a transition
   (`useTransition`). A timer-based debounce is not allowed (the static test rejects
   `setTimeout(`).
5. While the deferred value lags behind the input (`query !== deferredQuery` or `isPending`),
   render `Updating…` inside an element with `role="status"`; render it empty (or remove it)
   once the list is current.
6. `onListRender(query)` is called once per render of the results list with the query that
   render used. The list must be isolated with `React.memo` (or equivalent) so the urgent
   keystroke render does **not** re-render the list with its stale query — otherwise every
   keystroke renders the 10k rows anyway and `useDeferredValue` buys nothing.
7. Unmounting while a deferred render is pending must produce no errors or warnings.

## Acceptance criteria

- [ ] `filterItems`: empty query → all items (new array); `SENT` matches `Sentiment review` and
      `sentiment QA`; no match → `[]`; input not mutated.
- [ ] Mount renders the labelled input, named list, `5 matches`, all five rows, and an empty
      status; with 10k items the list shows 50 rows and `10000 matches`.
- [ ] `onListRender` is called exactly once on mount with `''`.
- [ ] Typing `sent` (user-event) shows two rows and `2 matches`; typing more to `sentzzz` shows
      `0 matches`.
- [ ] After a burst of keystrokes (no act), the input already shows the final text while the
      list still shows the previous results; the list catches up afterwards.
- [ ] `Updating…` is present in `role="status"` during the lag and gone after settling.
- [ ] Every query passed to `onListRender` is a prefix of the final typed value; the last call is
      the final value.
- [ ] Senior: with 10k items and 7 interleaved keystrokes, `onListRender` is called fewer than
      7 times, never with the stale `''` query, and the final rows are `utt-1230`…`utt-1239`.
- [ ] Senior: unmount mid-transition → no throw, no `console.error`.
- [ ] Tab reaches the input; rows are `listitem`s; the source uses `useDeferredValue` or
      `useTransition` and no `setTimeout(`.

## Baseline a11y

- The input has a visible, associated label (`Filter`).
- The pending indicator uses `role="status"` (polite live region) so screen readers announce
  it without stealing focus.
- Results use `role="list"` with an accessible name; each row is a `listitem`.

## Constraints

- No third-party libraries. React 19 only.
- No `setTimeout`/debounce for the deferral. No virtualization needed — cap at 50 rows.
- Do not store the filtered array in state; derive it (memoized) inside the list component.

## Debounce vs. useDeferredValue vs. useTransition

| | Debounce (`setTimeout`) | `useDeferredValue` | `useTransition` |
|---|---|---|---|
| What is delayed | The *state update* itself (nothing renders until the timer fires) | The *consumer* of a value; the input renders immediately, the deferred copy lags | A specific `setState` call marked non-urgent |
| Fixed delay? | Yes — a wall-clock guess (300 ms) that is too slow on fast machines and too fast on slow ones | No — React renders the deferred value as soon as the urgent work is done, interrupting it if new input arrives | No — same as deferred value |
| Stale work | The timer is reset, but once it fires the render runs to completion | Interrupted and discarded when a newer value arrives | Interrupted and discarded |
| Pending indicator | You build one (`pending = draft !== committed`) | `query !== deferredQuery` | `isPending` from the hook |
| Where it lives | Anywhere (works for network requests too) | Where you only have the *value* (e.g. a prop from a parent you do not control) | Where you own the *setter* and want to mark the update |
| Right for | Side effects you must rate-limit: network calls, URL writes, analytics | Expensive rendering of a value you receive | Expensive rendering triggered by an event you handle (tab switch, filter change) |

Rule of thumb: debounce **effects**, defer **renders**. If the expensive thing is a network
request, concurrent features do not help; if it is rendering, a debounce only adds latency.
`useDeferredValue` and `useTransition` are the same mechanism viewed from the value side vs. the
setter side — pick the one that matches what you have access to. A `React.memo` boundary around
the expensive subtree is required for either to help.

## Interviewer follow-ups

- The list is capped at 50 rows. If the product wants all 10k rows visible, which concurrent
  feature still helps and where does virtualization become mandatory?
- `useDeferredValue` keeps the *previous* result on screen while rendering the new one. When is
  that wrong UX (e.g. switching datasets) and how would you show a skeleton instead?
- The filter runs on the main thread. At what size would you move it to a Web Worker, and how
  does that change the pending/stale handling?
- React 19's `useDeferredValue(value, initialValue)` lets the first render be cheap. How would
  you use it so the 10k list does not block the initial paint?

## Say out loud

- **State shape first:** a single `query: string` is the only state; `deferredQuery` is derived
  by React; the filtered rows are derived (memoized) from `(items, deferredQuery)`.
- **Race / cleanup hazard:** no timers to clear, but the memo boundary is the hazard — if the
  list receives an unstable prop (inline callback, fresh array) the urgent render re-renders it
  and the deferral is defeated. Unmount mid-transition must not update state.
- **One data-shape question:** "Are items unique strings, or can two rows have the same text —
  what do I key on?"
- **One failure-handling question:** "If `items` arrives later from the network, should the
  filter show `Updating…` or a loading state while the list is empty?"
- **First test you'd write:** `filterItems(items, 'SENT')` returns both sentiment rows — the pure
  function before any concurrent-rendering test.
