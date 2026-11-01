# 071. Span Labeler

**Difficulty:** Hard
**Topics:** Range Selection, Controlled State, Overlap Validation, Keyboard Interaction, Derived Rendering

---

## Scenario

The NER (named-entity recognition) task editor on the data-annotation platform
lets annotators select a run of tokens in a sentence and tag it — `PERSON`,
`ORG`, `DATE`, and so on. The first version built the selection on
`window.getSelection()`: it broke on touch devices, happily produced
overlapping spans that corrupted the CoNLL export, and was mouse-only, so
keyboard annotators could not use it at all. Build a token-based labeler: the
sentence is pre-tokenised, selection snaps to whole tokens, overlap is rejected
at selection time, and everything works from the keyboard.

The component is fully controlled: `value` is the list of spans, `onChange`
proposes the next list. The only internal state is the pending selection
(anchor/focus token indices) and which existing span is currently selected.

## Acceptance Criteria

- Renders each token as a `role="button"` named by its text (e.g. `Tim`), in
  order, inside a container with `role="group"` named `Tokens`.
- Clicking a free token makes it the pending selection (`aria-pressed="true"`).
  Shift+clicking another free token extends the selection to the contiguous
  range between the anchor and that token, in either direction. A plain click
  elsewhere restarts the selection from that token.
- While a selection is pending, a label palette is rendered: one `role="button"`
  per entry of `labels` (named `PERSON`, `ORG`, …). Clicking a label calls
  `onChange` with the new span appended to `value` (normalised so
  `start <= end`) and clears the pending selection. With no pending selection
  the palette is not rendered at all.
- Tokens inside an existing span are rendered inside a `<mark>` with
  `aria-label="<LABEL>: <joined token text>"`. They cannot start or extend a
  selection: clicking one selects that span instead. A shift+click (or
  Shift+Arrow) range that would include any token of an existing span is
  rejected — the pending selection does not change and an element with
  `role="alert"` shows `Spans cannot overlap`. The next valid extension clears
  the alert.
- Clicking an existing span marks it selected (`aria-selected="true"` on the
  `<mark>`); pressing `Delete` or `Backspace` then calls `onChange` with
  `value` minus that span. With no span selected, Delete/Backspace do nothing.
- Keyboard: with a token focused, `ArrowRight`/`ArrowLeft` move focus to the
  next/previous token; `Space` sets the anchor on the focused token (same as a
  click); `Shift+ArrowRight`/`Shift+ArrowLeft` extend the pending selection by
  one token (subject to the same overlap rule).
- A summary with `role="list"` named `Spans` renders one item per span as
  `LABEL: text` (e.g. `PERSON: Tim Cook`).
- Fully controlled: rerendering with a different `value` re-renders the marks;
  the component never keeps its own copy of the spans.

## Example

```tsx
const tokens = ['Tim', 'Cook', 'joined', 'Apple', 'in', 'August', '1998', '.'];
const [spans, setSpans] = useState<Span[]>([]);

<SpanLabeler
  tokens={tokens}
  labels={['PERSON', 'ORG', 'DATE']}
  value={spans}
  onChange={setSpans}
/>
// click "Tim" → shift+click "Cook" → click PERSON
//   → onChange([{ start: 0, end: 1, label: 'PERSON' }])
// click "Apple" (free) → click ORG
//   → onChange([{ start: 0, end: 1, label: 'PERSON' }, { start: 3, end: 3, label: 'ORG' }])
// click "1998" → shift+click "Cook" → alert "Spans cannot overlap", selection stays on "1998"
```

## Target

45–60 minutes. Senior signals: a single `anchor`/`focus` pair as the only
selection state with the normalised range derived at render time; one overlap
check reused by click and keyboard paths; marks and the summary derived from
`value` on every render rather than mirrored into state; and a token render
loop that emits either a bare button or a `<mark>` wrapping a run of buttons.

## Interviewer follow-up

Product wants character-level offsets instead of token indices so annotators
can split hyphenated words, while still snapping to token boundaries by
default. How would you move to the Selection API (`window.getSelection()`,
`Range`) for input while keeping token snapping and touch support? And for the
upcoming relation-extraction task, spans must be allowed to nest and overlap
(`[ORG [PERSON Tim Cook]'s Apple]`) — how would you change the `Span` model,
the overlap rule, and the `<mark>` rendering to represent that?
