# 070. Label Hotkeys

**Difficulty:** Medium
**Topics:** Keyboard Shortcuts, Roving Focus, Controlled Components, Listbox A11y

---

## Scenario

The data-annotation platform's annotators classify thousands of short
utterances a day — "Positive", "Negative", "Neutral", "Spam" — and the
mouse-only labeling UI was the bottleneck: click the row, click the label,
scroll, repeat. Build a keyboard-first classifier: the annotator moves through
the item list, presses a digit to label the active item and automatically
advances to the next one. The first version shipped three bugs: hotkeys fired
while the annotator was typing in the note field (typing "1" in a note labeled
the row), DOM focus got lost after relabeling (the next arrow key did
nothing), and screen readers announced nothing when a label was applied.

The component is fully controlled: it receives `value` (item id → label key)
and reports every change via `onChange(next)`; it never stores assignments
itself. The active item (cursor) is internal UI state.

## Acceptance Criteria

- Renders a `role="listbox"` named `Items` with one `role="option"` per item
  showing the item text. The active item has `aria-selected="true"`, all
  others `"false"`. Roving tabindex: exactly one option is tabbable
  (`tabIndex={0}`, the active one) and the rest are `tabIndex={-1}`. The first
  item is active initially.
- Renders a legend of labels: each label shown as `<kbd>key</kbd> name`
  (e.g. "1 Positive").
- `ArrowDown` / `ArrowUp` (and vim-style `j` / `k`) move the active item and
  move DOM focus to the newly active option. Movement does not wrap past
  either end.
- Pressing a label digit while focus is in the listbox calls `onChange` with
  the active item's id mapped to that key (other assignments preserved) and
  advances the active item to the next one — but not past the last item.
- `Backspace` clears the active item's assignment: `onChange` is called with
  that id mapped to `undefined`, other assignments preserved.
- A labeled option shows its label name inside the option (e.g. the text
  contains `Positive`) and sets `aria-describedby` to the id of an element
  containing that label name. An unlabeled option has no `aria-describedby`.
- Hotkeys are ignored while focus is inside the `Note` textarea rendered
  below the list: typing `1` there must not call `onChange`.
- A digit with no matching label does nothing (no `onChange`, cursor stays).
- A `role="status"` element shows progress as `N of M labeled`, computed
  from `value` (only ids present in `items` count).
- Controlled: re-rendering with a new `value` updates the labels shown on
  the options and the progress text.

## Example

```tsx
const labels = [
  { key: '1', name: 'Positive' },
  { key: '2', name: 'Negative' },
  { key: '3', name: 'Neutral' },
];
const items = [
  { id: 'u1', text: 'Loved the new episode!' },
  { id: 'u2', text: 'Player keeps buffering.' },
];
const [value, setValue] = useState<Assignments>({});
<LabelHotkeys items={items} labels={labels} value={value} onChange={setValue} />
// Tab into the list (u1 active) → press "1"
//   → onChange({ u1: '1' }), u2 becomes active and focused
// press "2" → onChange({ u1: '1', u2: '2' }), u2 stays active (last item)
// press Backspace → onChange({ u1: '1', u2: undefined })
// status reads "1 of 2 labeled"
```

## Target

30–40 minutes. Senior signals: a single `onKeyDown` on the listbox (not a
window listener) so the note field is untouched by construction; roving
tabindex with refs so focus follows the cursor after every move or label;
`aria-selected` + `aria-describedby` so assistive tech hears both position and
label; a clamped cursor that never runs past the ends.

## Interviewer follow-up

- The real queue has 10k items. Roving tabindex needs every option in the DOM
  to receive focus — how do you reconcile that with virtualization? Compare
  roving tabindex vs. `aria-activedescendant` on the listbox, and where the
  cursor state has to live in each design.
- Annotators want to remap hotkeys (e.g. `a`/`s`/`d`/`f` instead of digits).
  Screen reader users already rely on single-letter quick navigation keys.
  How do you let users remap without breaking them — modifier requirement,
  a "hotkeys only while in the listbox" scope, or an opt-in toggle — and
  how would you persist and validate the mapping?
