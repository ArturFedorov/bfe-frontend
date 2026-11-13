# 105. Transfer List

**Difficulty:** Medium
**Estimated time:** 35 min
**Topics:** Dual listbox (WAI-ARIA `listbox` multiselect), roving tabindex, highlight vs membership, controlled `Set` value, derived filtering

---

## Scenario

The playlist editor in the media-operations console lets a curator pick which
assets go into a release playlist. The current UI is two `<select multiple>`s
glued together with a "move" button — it loses the order assets were added in,
the filter box hides items but keeps them silently selected (so "move all"
drags invisible assets along), and keyboard users cannot extend a selection
without a mouse.

Build a `<TransferList>`: two multiselectable listboxes (Available / Selected),
a filter per side, four move buttons, full keyboard support, and a live count.
The component is controlled: the ids on the right live in a `Set` owned by the
parent, and its insertion order is the display order on the right.

## Contract

```tsx
interface TransferItem { id: string; label: string }
type MoveDirection = 'right' | 'left';

partition(items, value): { left: TransferItem[]; right: TransferItem[] }
// left = items not in value, in `items` order
// right = items in value, in the Set's insertion order (ids without an item are skipped)

moveIds(value, ids, direction): Set<string>
// returns a NEW Set; 'right' appends ids in the given order, 'left' removes them

<TransferList
  items={TransferItem[]}
  value={Set<string>}            // ids currently on the right
  onChange={(next: Set<string>) => void}
  titles?={{ left: 'Available', right: 'Selected' }}
/>
```

### DOM shape (the tests query exactly this)

- Two `role="listbox"` elements, `aria-label` = `titles.left` / `titles.right`
  (defaults `Available` / `Selected`), each with `aria-multiselectable="true"`.
- Options are `role="option"` with the item label as text and `aria-selected`
  reflecting **highlight** (not membership). Exactly one option per listbox has
  `tabindex="0"`; the rest have `tabindex="-1"`.
- One `<input type="search">` per side with `aria-label` =
  `Filter <title lower-cased>` (`Filter available`, `Filter selected`).
- Buttons with accessible names `Move selected right`, `Move selected left`,
  `Move all right`, `Move all left` (visible glyphs are free; use `aria-label`).
- One `role="status"` element reading `N of M selected`, where N = items
  currently on the right and M = `items.length`.

## Requirements

1. **Two listboxes.** Render both sides from `partition(items, value)`. Right
   side order = move order (Set insertion order). Custom `titles` rename the
   listboxes and their filter labels.
2. **Highlight ≠ membership.** Clicking an option toggles its highlight
   (`aria-selected`) on that side. Highlighting never calls `onChange`.
3. **Filter.** Each side has its own case-insensitive substring filter over the
   label. Items hidden by the filter lose their highlight (they must not come
   back highlighted when the filter is cleared).
4. **Move buttons.** `Move selected right/left` move the highlighted *visible*
   ids; `Move all right/left` move every *visible* item on that side (filtered
   subset only). Each button is `disabled` when it has nothing to act on. A
   move calls `onChange(moveIds(value, ids, dir))` exactly once and clears the
   highlights on both sides.
5. **Keyboard inside a listbox.** Roving tabindex: `ArrowDown` / `ArrowUp`
   move focus (clamped at the ends); `Space` toggles the focused option's
   highlight; `Shift+ArrowDown/Up` moves focus **and** adds both the current and
   the new option to the highlight; `Ctrl+A` / `Meta+A` highlights every visible
   option on that side. `preventDefault` on handled keys.
6. **Status.** `role="status"` always reads `N of M selected`.

## Acceptance Criteria

- [ ] `partition` keeps `items` order on the left and Set insertion order on the
      right; ids without an item are skipped.
- [ ] `moveIds` returns a new Set, appends in the given order for `right`,
      removes for `left`, and never mutates its input.
- [ ] Both listboxes exist with `aria-multiselectable="true"` and the correct
      options; custom titles rename listboxes and filter labels.
- [ ] Moving `Delta` then `Alpha` right shows `Delta, Alpha` on the right.
- [ ] Clicking an option toggles `aria-selected`; `onChange` is not called.
- [ ] Filtering is case-insensitive substring per side; a highlighted item hidden
      by the filter is un-highlighted and stays so after the filter is cleared.
- [ ] Buttons are disabled when nothing applies (fresh render: only `Move all
      right` enabled).
- [ ] `Move selected right` with two highlighted items calls `onChange` with the
      ids appended; `Move selected left` removes.
- [ ] Senior: with the Available filter set to `trailer`, `Move all right` moves
      only the two matching items and leaves the others on the left.
- [ ] Senior: after any move, no option on either side is highlighted and both
      `Move selected` buttons are disabled.
- [ ] Roving tabindex: `ArrowDown` ×2 focuses the third option and moves
      `tabindex="0"` with it; `ArrowUp` goes back.
- [ ] `Space` toggles highlight; `Shift+ArrowDown` ×2 highlights three options.
- [ ] `Ctrl+A` highlights only the visible (filtered) options.
- [ ] `role="status"` reads `1 of 4 selected`, then `4 of 4 selected` after
      `Move all right`.

## Baseline a11y

- WAI-ARIA listbox pattern with `aria-multiselectable`; `aria-selected` on every
  option (true/false, never missing).
- One tab stop per listbox (roving tabindex); arrows move within.
- Every control has an accessible name; the count is announced via `role="status"`.
- Filter inputs are real `<input>`s with labels, not placeholders only.

## Constraints

- React only, no component libraries, no drag and drop.
- `value` is owned by the parent; never mutate the incoming Set.
- Filtering must be derived at render time, not copied into state.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The right side needs manual reordering (Move up / Move down). What changes in
  the data model when the order is no longer "insertion order of a Set"?
- 20k assets: what breaks first — filtering, highlight Sets, or the DOM — and
  what would you virtualise?
- Make the whole widget a single form field: how would you expose the value to
  a native `<form>` submit (hidden inputs vs `FormData` from a ref)?

## Say out loud

- State shape first: highlight is UI state (`Set` per side, local), membership
  is the controlled `value`; filter text is local; everything else is derived.
- Name the hazard: filters and highlights interact — "move all" must use the
  visible subset, and hiding an item must drop its highlight or the user moves
  things they cannot see.
- Ask one data-shape question: can `value` contain ids that are not in `items`?
  (Decide: yes, skip them when rendering, keep them in the Set.)
- Ask one failure-handling question: what should Shift+Arrow do at the end of
  the list — stay put or wrap? (Decide: clamp, no wrap, like a native listbox.)
- Name the first test you would write: "Move all right with a filter active
  moves only the filtered items".
