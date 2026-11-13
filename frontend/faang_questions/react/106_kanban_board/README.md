# 106. Kanban Board

**Difficulty:** Hard
**Estimated time:** 35 min
**Topics:** Normalised board state, pure move with structural sharing, keyboard "move mode" with live announcements, pointer drag with `elementFromPoint`, controlled component

---

## Scenario

The release board in the media-operations console tracks every asset through
`To review → In QC → Approved`. The first version used a drag-and-drop library
that only worked with a mouse: keyboard users could not move a card at all,
screen readers heard nothing, and every drop re-created the whole board object
so memoised columns re-rendered on each move.

Build `<KanbanBoard>` on top of two pure functions. Cards move either with the
keyboard (a `Move` button enters a "move mode" driven by arrow keys and
announced through a live region) or with the pointer (press on a card, move,
release over a column). Both paths commit through `moveCard`, and a drop that
changes nothing must not call `onChange`.

## Contract

```ts
interface Card   { id: string; title: string }
interface Column { id: string; title: string; cardIds: string[] }
interface Board  { columns: Column[]; cards: Record<string, Card> }

moveCard(board, cardId, toColumnId, toIndex): Board
// toIndex = position in the destination's cardIds AFTER the card is removed from
// its source (same-column moves count positions without the card itself);
// clamped to [0, length]. Unknown card/column, or "already there" => returns
// the SAME board reference. Untouched columns and `cards` keep their identity.

reorderColumn(board, columnId, from, to): Board
// card at index `from` ends up at index `to` in that column; same identity rules

<KanbanBoard value={Board} onChange={(next: Board) => void} />
```

### DOM shape (the tests query exactly this)

- One `role="list"` per column whose accessible name is the column title;
  each card is a `role="listitem"` containing the title text and a `<button>`
  named `Move` with `aria-pressed` (`"false"` normally, `"true"` while that
  card is in move mode).
- Each column's drop zone element carries `data-column-id="<column.id>"` and
  contains the list; each card element carries `data-card-id="<card.id>"`.
- One `role="status"` element (polite live region) for move-mode messages.

## Requirements

1. **Pure `moveCard` / `reorderColumn`.** Immutable; new arrays only for the
   source and destination column; `cards` and untouched columns keep identity;
   no-op (same column, same index; unknown ids) returns the input board itself.
2. **Rendering.** Columns from `value.columns`, in order; cards from
   `value.cards[id]`.
3. **Keyboard move mode.** Clicking `Move` enters move mode for that card:
   the button gets `aria-pressed="true"` and the status reads exactly
   `Moving "<title>". Use arrow keys to choose a position, Enter to drop, Escape to cancel`.
   While in move mode, with focus on that button: `ArrowLeft` / `ArrowRight`
   pick the target column (clamped), `ArrowUp` / `ArrowDown` the target index
   (clamped), and the board shows a **live preview** of the card at the target
   (`moveCard(value, …)` rendered, not committed). Each arrow key updates the
   status with the target column title and position. Focus stays on the
   card's `Move` button even when the preview moves it into another column.
   `Enter` (or clicking `Move` again) commits: `onChange(moveCard(...))` once,
   **only if the board actually changed**. `Escape` leaves move mode and the
   original `value` renders again — no `onChange`.
4. **Pointer drag.** `pointerdown` on a card (not on its button) starts a
   drag; at least one `pointermove` must follow or the release is a click.
   On `pointerup`, resolve the drop target with
   `document.elementFromPoint(clientX, clientY)` → closest `[data-column-id]`.
   Drop index = number of other cards in that column whose vertical midpoint
   (`getBoundingClientRect`) is above `clientY`. Call `onChange` **once** with
   `moveCard(...)`; a release outside any column, or a drop that lands the card
   where it already is, calls nothing.
5. **Controlled.** The component never stores the board; preview state is
   local and discarded on commit/cancel.

## Acceptance Criteria

- [ ] `moveCard` moves between columns at the index, reorders within a column
      using the post-removal index, clamps, and leaves the input untouched.
- [ ] `moveCard` returns the same board for an unknown card or column.
- [ ] Senior: `moveCard` is a no-op (same reference) when the card is already at
      that position; after a real move `next.cards` and untouched columns keep
      their identity.
- [ ] `reorderColumn(board, 'todo', 0, 2)` gives `[c2, c3, c1]`; out-of-range
      `from`, unknown column, or `from === to` return the same board.
- [ ] Three lists named `To review` / `In QC` / `Approved` with the right
      listitems; every `Move` button has `aria-pressed="false"`.
- [ ] Clicking `Move` sets `aria-pressed="true"` and the exact status message.
- [ ] `ArrowRight` previews the card in the next column, status names that
      column, focus stays on the Move button; `Enter` calls `onChange` once with
      the card appended there and leaves move mode.
- [ ] `ArrowDown` ×3 clamps at the end of the column; `ArrowUp` then `Enter`
      commits the reorder.
- [ ] `Escape` after moving the preview restores the original lists and never
      calls `onChange`.
- [ ] Senior: `Enter` without a position change does not call `onChange`.
- [ ] Pointer: down on a card, move, up over `Approved` (stubbed
      `elementFromPoint`) calls `onChange` exactly once with the card in
      `Approved`.
- [ ] Pointer: dropping over `To review` at a large `clientY` appends to the end.
- [ ] Pointer: a release outside any column, or an up without a move, does nothing.
- [ ] Senior: dropping the last card of `To review` back into `To review` at the
      end is a no-op — no `onChange`.

## Baseline a11y

- Columns are named lists; cards are list items with a single real `<button>`
  so Enter/Space work natively.
- `aria-grabbed` is deprecated in ARIA 1.1 — use `aria-pressed` on the Move
  button plus `role="status"` announcements for the move-mode state.
- Every state change in move mode is spoken (start, each position, drop,
  cancel). Keyboard and pointer reach the same result.
- `aria-describedby` from the Move button to the card title disambiguates the
  otherwise identical `Move` buttons for screen readers.

## Constraints

- React only. No drag-and-drop library, no HTML5 `draggable` / DataTransfer.
- Document-level `pointermove` / `pointerup` listeners must be removed on
  release (and on unmount).
- `moveCard` is the only way state changes — the keyboard path and the pointer
  path both call it.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- A teammate wants to show a drop placeholder while dragging with the pointer.
  Where does the hover column/index live, and how do you avoid re-rendering the
  whole board on every `pointermove`?
- Make the board collaborative: two users move the same card at once. What
  does `moveCard` need (versions? operation log?) to resolve the conflict?
- Columns are 50 wide and cards are 10k: which parts need virtualisation and
  what happens to `elementFromPoint` with virtualised rows?

## Say out loud

- State shape first: the board is normalised (`cards` by id, columns hold
  ids), the component is controlled, and move mode is local state
  `{ cardId, columnId, index }` from which the preview is **derived** with
  `moveCard` on every render.
- Name the hazard: the preview re-parents the card into another list, so React
  remounts the `<li>` and focus falls to `<body>` — refocus the Move button in
  an effect while move mode is active.
- Ask one data-shape question: is `toIndex` before or after removing the card
  from its source? (Decide: after — it makes same-column moves unambiguous.)
- Ask one failure-handling question: what if `pointerup` fires over nothing
  (`elementFromPoint` returns `null`, e.g. outside the window)? (Decide: cancel
  silently; the board is unchanged.)
- Name the first test you would write: "dropping a card onto its own position
  does not call onChange".
