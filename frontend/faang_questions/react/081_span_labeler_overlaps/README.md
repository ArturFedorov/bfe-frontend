# 081. Span Labeler with Overlaps

**Difficulty:** Very Hard
**Estimated time:** 60 minutes
**Topics:** Selection API, Character Offsets, Surrogate Pairs, Overlapping/Nested Spans, Derived Rendering, Keyboard Interaction

---

## Scenario

The relation-extraction task on the ML data-annotation platform needs spans
that can nest and overlap: `[EVENT [PERSON Tim Cook] joined [ORG Apple]]`.
The token-based labeler (071) cannot express this, splits hyphenated words
wrongly, and the CoNLL export now wants raw character offsets. Annotators
select text with the mouse (the selection often crosses existing highlighted
spans) and QA analysts fix boundaries from the keyboard. The text contains
emoji and other astral characters, and the model-assisted suggestion service
has already produced broken exports where an offset landed between the two
halves of a surrogate pair.

Build the character-offset labeler: render the text as segments split at
every span boundary, derive the offsets of a mouse selection from
`window.getSelection()`, snap them outward so no surrogate pair is ever split,
and support label, relabel, delete and Shift+Arrow extension from the
keyboard. Fully controlled: `value` is the list of spans, `onChange` proposes
the next list.

## Requirements

1. Offsets are UTF-16 code-unit indices into `text` (JS string indices);
   `start` is inclusive, `end` exclusive. A span never starts or ends between
   the two halves of a surrogate pair.
2. Rendering: split `text` into segments at every distinct `start`/`end` of
   every span (plus `0` and `text.length`). Render each non-empty segment as a
   `<span data-segment>` whose `data-labels` attribute lists the labels of
   **all** spans covering it (in `value` order, joined by `,`; empty string
   when uncovered). Covered segments get
   `aria-label="<labels joined by ,>: <segment text>"`; uncovered segments
   have no `aria-label`. The concatenated segment text equals `text`.
   Overlapping and nested spans must both work.
3. Segments live inside a container with `role="group"` named `Text`. Each
   segment is focusable (`tabIndex=0`).
4. A `role="list"` named `Spans` renders one `listitem` per span as
   `LABEL: text`, in `value` order.
5. Mouse selection: on `mouseup` on the container, read
   `window.getSelection()`. Ignore collapsed selections and selections whose
   anchor or focus is outside the container. Compute container-relative
   offsets (segment start + offset within the segment's text node) for anchor
   and focus, normalise so `start < end`, snap outward off surrogate-pair
   halves, and store it as the pending selection.
6. While a pending selection exists, render a palette: `role="group"` named
   `Labels` with one `role="button"` per entry of `labels`. Clicking one calls
   `onChange([...value, { id: newId(), start, end, label }])` and clears the
   pending selection. No pending selection → no palette.
7. Keyboard, with focus inside the container and a pending selection:
   `Shift+ArrowRight` moves the pending `end` forward by one code point
   (both halves of a surrogate pair at once); `Shift+ArrowLeft` moves it back
   by one code point but never to `<= start`. `Escape` clears the pending
   selection and the span selection.
8. Existing spans: clicking a segment covered by **exactly one** span selects
   that span: every segment it covers gets `aria-selected="true"`, the pending
   selection is cleared. Clicking a segment covered by zero or several spans
   selects nothing. `Delete`/`Backspace` with a selected span calls
   `onChange` with `value` minus that span (by `id`); with none selected they
   do nothing.
9. While a span is selected, render a `<select>` labelled `Label`
   (`role="combobox"`, name `Label`) whose value is the span's label; changing
   it calls `onChange` with that span's `label` replaced and its `id` kept.
10. Fully controlled: segments and summary are derived from `value` on every
    render; the component never keeps its own copy of the spans.

## Acceptance Criteria

- [ ] Segments split at all span boundaries; `data-labels` and `aria-label`
      correct for uncovered, single, overlapping and nested coverage.
- [ ] Concatenated segment text equals the input text.
- [ ] Spans summary lists `LABEL: text` in `value` order.
- [ ] Selection across two segments produces the right container-relative
      offsets; label pick appends `{ id: newId(), start, end, label }`.
- [ ] Reversed selection normalised to `start < end`.
- [ ] Collapsed selection and selection outside the container are ignored
      (no palette).
- [ ] End inside an emoji snaps to after it; start inside an emoji snaps to
      before it.
- [ ] `Shift+ArrowRight` steps one code point and treats the emoji as one
      step; `Shift+ArrowLeft` steps back and never collapses.
- [ ] `Escape` removes the palette without calling `onChange`.
- [ ] Clicking a single-label segment marks all of that span's segments
      `aria-selected`; `Delete` removes exactly that span by id.
- [ ] `Label` combobox shows the current label and relabels keeping the id.
- [ ] `Delete` without selection and clicks on multi-label segments are
      no-ops.
- [ ] Rerendering with a new `value` re-splits segments and the summary.

## Baseline a11y

- Container `role="group"` named `Text`; segments focusable in document
  order; labelled segments expose `aria-label="LABELS: text"`.
- Palette `role="group"` named `Labels` with real `<button>`s.
- Label editor is a native `<select>` associated with a visible `Label` text
  (`role="combobox"`, name `Label`).
- Summary `role="list"` named `Spans`.
- Everything reachable with keyboard: Shift+Arrow to adjust, Delete/Backspace
  to remove, Escape to cancel.

## Constraints

- React + TypeScript only; no third-party libraries.
- Use the DOM Selection API (`window.getSelection()`, `Range`) for mouse
  input; no `contentEditable`.
- No layout APIs (`getBoundingClientRect`, `caretPositionFromPoint`): the
  tests run in jsdom and build the `Range` over your segment text nodes.
- Do not change the exported types or component signature; `newId` defaults
  to `crypto.randomUUID()`.

## Interviewer follow-ups (talk-through, not implemented)

- Touch devices fire `selectionchange` rather than a clean `mouseup`. How
  would you support them, and how do you avoid committing a selection while
  the user is still adjusting the handles?
- The text is 50k characters with 2k spans. The segment split is
  `O(spans × segments)` — how would you make it linear (sweep line), and
  what would you memoise?
- Offsets are code units today; the backend team wants Unicode code points,
  and the linguists want grapheme clusters (flags, ZWJ sequences, combining
  marks). What changes, and where does `Intl.Segmenter` fit?
- How would you render a visual depth cue for nesting (stacked underlines)
  without changing the DOM structure the tests rely on?

## Say out loud

- State shape first: only `pending: { start, end } | null` and
  `selectedId: string | null` live in the component; segments and the summary
  are derived from `value` each render.
- Name the race/cleanup hazard: `mouseup` fires for every click, so collapsed
  selections must be ignored, and a stale `selectedId` must be tolerated when
  `value` no longer contains that span.
- Ask one data-shape question: "Are offsets code units or code points on the
  wire, and is `end` exclusive?"
- Ask one failure-handling question: "If `value` arrives with a span that
  splits a surrogate pair or exceeds `text.length`, do we clamp, drop, or
  render it as-is?"
- Name the first test you'd write: "Overlapping spans render a segment whose
  `data-labels` carries both labels."
