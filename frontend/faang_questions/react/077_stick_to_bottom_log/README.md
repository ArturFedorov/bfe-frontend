# 077. Stick-to-Bottom Log

**Difficulty:** Medium · **Priority:** P1
**Estimated time:** 60 min
**Topics:** Scroll anchoring, ResizeObserver, refs vs state, derived counts, live regions

---

## Scenario

On the ML data-annotation platform an agent run streams its transcript — one
line per tool call, model token batch, or validation message — into a
scrollable log that QA analysts watch while the run executes. The first
version force-scrolled to the bottom on every new line, so an analyst who
scrolled up to re-read an earlier validation error was yanked back down within
a second and could never inspect anything while a run was live.

Build the transcript container that follows the stream while the analyst is at
the bottom, stops following the moment they scroll up, tells them how many
lines arrived while they were away, and resumes when they jump or scroll back.

## API

```tsx
<StickToBottomLog
  lines={string[]}                      // append-only transcript
  streaming={boolean}                   // true while the producer is still emitting
  threshold={number}                    // optional, default 16 (px from the bottom that still counts as "at the bottom")
  onFollowChange={(following) => void}  // optional
/>
```

## Requirements

1. Render a scrollable container with `role="log"` and `aria-live="polite"`
   containing one element per entry of `lines`, in order, with the line text.
2. The log reflects `streaming` as `aria-busy` (`"true"` while streaming,
   absent or `"false"` otherwise) so assistive tech waits for the burst to end
   before announcing.
3. The component starts in **following** mode. While following, whenever the
   content grows the container is pinned to the bottom:
   `scrollTop === scrollHeight - clientHeight`.
4. Content growth is detected with a `ResizeObserver` observing an element
   **inside** the log (the wrapper around the lines), not the scroll container
   itself. The observer is disconnected on unmount.
5. On a `scroll` event, compute `distance = scrollHeight - clientHeight -
   scrollTop`. If `distance > threshold` the user has scrolled away: following
   becomes `false`. If `distance <= threshold` following becomes `true`.
6. While not following, new lines must **not** move `scrollTop`.
7. While not following, render a button whose accessible name is
   `Jump to latest (N new)` where `N` is the number of lines appended since
   following stopped (starts at `0`). The button is not rendered while
   following.
8. Clicking the button pins the container to the bottom, resumes following, and
   removes the button (count resets).
9. Scrolling back to within `threshold` of the bottom also resumes following
   and clears the count.
10. `onFollowChange(following)` fires only on transitions — not on mount, and
    not again for repeated scroll events that leave the mode unchanged.

## Acceptance criteria

- [ ] `role="log"` with `aria-live="polite"` renders every line in order.
- [ ] `aria-busy` mirrors the `streaming` prop.
- [ ] A `ResizeObserver` observes a descendant of the log and is disconnected on unmount.
- [ ] Following + content grows → `scrollTop === scrollHeight - clientHeight`.
- [ ] No Jump button and no `onFollowChange` call on mount.
- [ ] Scroll with `distance > threshold` → `onFollowChange(false)` once, button `Jump to latest (0 new)` appears.
- [ ] Scroll with `distance === threshold` keeps following; a custom `threshold` prop is honoured.
- [ ] Appending lines while scrolled away leaves `scrollTop` unchanged and increments the count (`2 new`, then `3 new`).
- [ ] Repeated scroll events far from the bottom call `onFollowChange` exactly once.
- [ ] Jump click → pinned, button removed, `onFollowChange(true)`, later growth pins again.
- [ ] Manual scroll back within threshold → following resumes, button removed; a later scroll-away restarts the count at `0 new`.

## Baseline a11y (graded inline)

- The container is `role="log"` with `aria-live="polite"`; `aria-busy` reflects `streaming`.
- The jump control is a real `<button>` with the full count in its accessible name.
- No focus is stolen from the user when lines arrive.

## Constraints

- No third-party libraries.
- jsdom has no layout engine and no `Element.scrollTo`: tests fake
  `scrollHeight` / `clientHeight` with `Object.defineProperty`, drive
  `scrollTop` directly, and fire `scroll` events. Pin by assigning
  `el.scrollTop` (the tests also shim `el.scrollTo` to do the same).
- Use the global `ResizeObserver` (tests install `FakeResizeObserver` from
  `_helpers/fake_observers.ts`). Do not poll with timers.

## Interviewer follow-ups (talk through, do not implement)

- A real browser fires a `scroll` event for the programmatic pin as well. How do you avoid misreading your own pin as a user scroll, and does your `distance <= threshold` rule already cover it?
- Images or code blocks in a line load late and grow after the line was appended. How does the ResizeObserver approach handle that versus pinning in a layout effect on `lines`?
- Thousands of lines: how would you virtualise this list without breaking pinning and the "N new" count?
- `aria-live="polite"` on a log that gets 20 lines per second is noisy. What would you announce instead, and when?

## Say out loud (before typing)

- **State shape first:** `following: boolean`, `anchorCount: number` (length of `lines` when following stopped) — the "N new" is derived, not stored.
- **Race / cleanup hazard:** the ResizeObserver callback reads `following` from a ref, not a stale closure; disconnect on unmount.
- **One data-shape question:** are `lines` append-only, or can the array be replaced (new run) — and what should the count do then?
- **One failure-handling question:** if `ResizeObserver` is unavailable (old WebView), do we fall back to pinning on `lines` change only?
- **First test you'd write:** "scrolling up beyond the threshold stops auto-scroll and shows `Jump to latest (0 new)`."
