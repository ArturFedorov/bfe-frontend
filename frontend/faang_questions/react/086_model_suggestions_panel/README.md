# 086. Model Suggestions Panel

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** Controlled Lists, Derived State, Roving Tabindex, Listbox A11y, Stale Data

---

## Scenario

The annotation platform runs a pre-labeling model over every utterance before
a human sees it. The model returns a list of suggestions — a label, the span
text it applies to, and a confidence score — and annotators triage them: keep
the obvious ones, drop the junk, and only look closely at the middle. The first
version had three problems: "Accept all" fired one accept per suggestion, so
Undo had to be pressed 40 times to back out of a bad batch; suggestions
computed for an older revision of the text were still accepted after the
annotator edited the text, writing spans at offsets that no longer existed;
and the whole panel was mouse-only.

Build the panel. It is fully controlled: the parent owns the list of
suggestions and the current `textVersion`; the panel only reports decisions
via `onAccept(ids)` and `onReject(id)`. The threshold and the active
(keyboard cursor) suggestion are internal UI state.

## Contract

```tsx
interface Suggestion {
  id: string;
  label: string;
  text: string;
  confidence: number;   // 0..1
  textVersion: number;  // version of the text these offsets were computed for
}

<SuggestionsPanel
  suggestions={suggestions}
  textVersion={textVersion}
  onAccept={(ids) => applyAcceptCommand(ids)}   // ONE call = ONE undoable command
  onReject={(id) => markRejected(id)}
/>
```

Also export the pure filter used by the component so it can be unit-tested
without React:

```ts
filterSuggestions(suggestions, textVersion, threshold): Suggestion[]
// keeps order; keeps only suggestions with textVersion === textVersion
// AND confidence >= threshold
```

## Requirements

1. **Threshold slider.** Render `<input type="range" aria-label="Confidence threshold">`
   with `min=0 max=1 step=0.05`, default `0.5`. Only suggestions with
   `confidence >= threshold` are listed. Changing the slider re-filters
   immediately.
2. **Listbox.** Render `role="listbox"` named `Suggestions` with one
   `role="option"` per visible suggestion, in the order given. Each option
   shows the label, the text, and the confidence as a whole percentage
   (`0.92` → `92%`).
3. **Per-item actions.** Each option contains an `Accept` button and a
   `Reject` button. Accept calls `onAccept([id])`; Reject calls `onReject(id)`.
4. **Accept all.** A button named `Accept all above threshold` calls `onAccept`
   exactly once with the ids of every visible suggestion, in display order.
   With nothing visible it does not call `onAccept` at all (disabled or no-op).
5. **Keyboard.** Roving tabindex: exactly one option has `tabIndex={0}` (the
   active one, `aria-selected="true"`); all others are `tabIndex={-1}` and
   `aria-selected="false"`. The first visible option is active initially.
   `ArrowDown` / `ArrowUp` move the active option and DOM focus, without
   wrapping. `Enter` calls `onAccept([activeId])`; `Delete` calls
   `onReject(activeId)`. Clicking an option makes it active.
6. **Stale suggestions.** A suggestion whose `textVersion` differs from the
   `textVersion` prop is never rendered and never included in accept-all.
   When the prop changes, previously listed items disappear and a
   `role="status"` element reads `N suggestions discarded (text changed)`,
   where `N` is the number of suggestions in the current `suggestions` prop
   whose `textVersion` does not match (regardless of threshold). The literal
   format is `N suggestions discarded (text changed)` for any N ≥ 1; when
   N is 0 the status is empty.
7. **Active cursor survives list changes.** If the active suggestion
   disappears (filtered out, accepted and removed by the parent, or discarded
   by a version bump), the active option becomes the first remaining visible
   option. There is never a stale `aria-activedescendant` or more than one
   tabbable option.
8. **Empty state.** When nothing is visible, render the text
   `No suggestions above threshold` and no options.

## Acceptance Criteria

- [ ] `filterSuggestions` keeps order, treats `confidence === threshold` as
      visible, and drops mismatched `textVersion`.
- [ ] Slider is `type="range"`, labelled `Confidence threshold`, default `0.5`,
      `step=0.05`.
- [ ] Options show label, text and `NN%`; only `confidence >= 0.5` listed by
      default.
- [ ] Moving the slider to `0.9` hides lower-confidence options.
- [ ] Per-item `Accept` → `onAccept([id])`; `Reject` → `onReject(id)`.
- [ ] `Accept all above threshold` → one `onAccept` call with all visible ids;
      never called when nothing is visible.
- [ ] Roving tabindex: one tabbable option, `aria-selected` on the active one.
- [ ] `ArrowDown` / `ArrowUp` move active + focus; no wrap.
- [ ] `Enter` accepts the active item; `Delete` rejects it.
- [ ] Stale items are not rendered on mount and not included in accept-all.
- [ ] Bumping `textVersion` removes items and the status reads
      `N suggestions discarded (text changed)`.
- [ ] Empty state text when nothing passes the filter.
- [ ] Senior: after moving the slider to `0.9`, accept-all passes only ids with
      `confidence >= 0.9`.
- [ ] Senior: bumping `textVersion` while a non-first item is active moves the
      active option to the first remaining item, exactly one option stays
      tabbable, and any `aria-activedescendant` on the listbox points to an
      element that exists.

## Baseline a11y

- Slider has an accessible name (`aria-label="Confidence threshold"`).
- Listbox has an accessible name (`Suggestions`); options use `aria-selected`
  and roving `tabIndex`.
- The discard notice is in a `role="status"` region so it is announced.
- Buttons have visible text labels (`Accept`, `Reject`,
  `Accept all above threshold`).

## Constraints

- No third-party libraries beyond React.
- The component never stores suggestions; it derives everything from props +
  `threshold` + the active id. Do not copy `suggestions` into state.
- Do not use `window` key listeners — handle keys on the listbox.

## Interviewer follow-ups (talk-through only)

- The parent treats `onAccept(ids)` as one undoable command. Sketch the
  command object (`do`/`undo`) and what happens if one of the ids was already
  accepted by another annotator between the model run and the click.
- `textVersion` is a monotonically increasing integer today. What if the
  text can be edited collaboratively and versions become vector clocks or
  content hashes — what changes in the staleness check?
- 500 suggestions per document: the percentage formatting and filtering run
  on every slider tick. Where would you memoize, and what would you measure
  first before doing so?
- A screen-reader user moves through options and presses Enter. What should
  be announced after accepting (the item vanishes under them), and where does
  focus go?

## Say out loud

- State shape first: `threshold: number`, `activeId: string | null`; everything
  else (visible list, discarded count, active index) is derived.
- Name the hazard: the active id can point at an item that no longer exists
  after a filter/version/parent change — derive the index with a fallback
  instead of storing an index.
- Ask one data-shape question: can two suggestions share an `id` across
  versions, or are ids unique per model run?
- Ask one failure-handling question: if `onAccept` throws or the parent
  rejects some ids, should the panel show anything, or is that the parent's
  job?
- Name the first test you would write: "accept-all after moving the slider to
  0.9 calls `onAccept` once with only the ids ≥ 0.9".
