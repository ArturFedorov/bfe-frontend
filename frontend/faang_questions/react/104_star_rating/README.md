# 104. Star Rating

**Difficulty:** Easy
**Estimated time:** 35 min
**Topics:** WAI-ARIA radiogroup, roving tabindex, hover preview vs committed value, half steps from pointer geometry, controlled vs uncontrolled, read-only rendering

---

## Scenario

QA reviewers in the media-operations console score every asset review
(1–5 stars, half stars for the picky ones). The existing widget is five
`<span onClick>`s: no roles, no keyboard, hover immediately *saves* the value
(reviewers accidentally re-score by moving the mouse), and the read-only
version on the asset page is five unlabeled Unicode stars that a screen reader
announces as "black star black star black star…".

Build `<StarRating>`: a radiogroup of stars with a hover **preview** that never
commits, click to set, arrow keys to step, half steps from the pointer position
when `allowHalf`, and a read-only mode that collapses to one labelled image.

## Contract

```tsx
// star_rating.tsx
<StarRating
  label={string}            // accessible name of the group (required)
  value?={number}           // controlled rating
  defaultValue?={number}    // uncontrolled start, default 0
  onChange?={(value: number) => void}
  max?={number}             // default 5
  allowHalf?={boolean}      // default false; steps of 0.5
  allowClear?={boolean}     // default true; clicking the selected star -> 0
  readOnly?={boolean}       // default false
/>

clampRating(v: number, max: number, allowHalf: boolean): number
// clamps to [0, max]; rounds to the nearest 0.5 when allowHalf, else to the
// nearest integer; NaN -> 0
```

### DOM shape (the tests query exactly this)

- Interactive root: `role="radiogroup"` with `aria-label={label}`. While a
  star is hovered the root carries `data-preview="<hovered value>"` (e.g.
  `"4"` or `"2.5"`); when nothing is hovered the attribute is absent.
- Each star: `role="radio"` with `aria-label` `1 star` / `N stars`,
  `aria-checked="true"` on exactly the star `ceil(value)` (none when
  `value === 0`), `data-fill` = `"full" | "half" | "empty"` computed from the
  **preview if hovering, else the value**, and roving `tabIndex`: `0` on the
  checked star, or on the first star when `value === 0`; `-1` elsewhere.
- Read-only root: `role="img"` with `aria-label` `Rated N of M` (N as written
  by JS: `3`, `3.5`), no `radio`s inside, no `tabIndex`.

## Requirements

1. **Roles.** Radiogroup named by `label`; `max` radios labelled `1 star`,
   `2 stars`, …; `aria-checked` on the star matching the value;
   `data-fill` reflects full / half / empty per star.
2. **Hover preview.** Moving the pointer over star N sets `data-preview` to N
   on the root and fills stars up to N, **without** calling `onChange`;
   leaving the group removes the preview and the fill returns to the value.
3. **Click to set / clear.** Clicking star N calls `onChange(N)`. Clicking the
   star that already equals the value calls `onChange(0)` when `allowClear`
   (default); with `allowClear={false}` it does nothing.
4. **Keyboard.** With focus on the tabbable star: `ArrowRight` / `ArrowUp`
   increase by one step (1, or 0.5 when `allowHalf`), `ArrowLeft` / `ArrowDown`
   decrease by one step down to 0, `Home` sets one step (the lowest non-zero
   rating), `End` sets `max`. Each key calls `onChange(next)`, clamps at the
   ends, and moves focus to the newly checked star (first star for 0).
   `preventDefault` on handled keys.
5. **Half stars.** With `allowHalf`, the pointer position decides: a
   `clientX` left of the star's horizontal midpoint (from
   `getBoundingClientRect()`) means `N - 0.5`, right of it means `N`. Applies
   to both the hover preview and the click.
6. **Read-only.** `readOnly` renders `role="img"` labelled `Rated N of M`,
   no radios, and ignores clicks and keys (`onChange` never fires).
7. **Controlled / uncontrolled.** Without `value` the component owns the
   rating (start at `defaultValue`) and calls `onChange`. With `value` it only
   calls `onChange` and renders the prop.
8. **Pure helper.** `clampRating` is exported and used for every incoming and
   computed value.

## Acceptance Criteria

- [ ] `clampRating(7, 5, false) === 5`, `clampRating(-1, 5, false) === 0`,
      `clampRating(2.4, 5, false) === 2`, `clampRating(2.6, 5, true) === 2.5`,
      `clampRating(2.76, 5, true) === 3`, `clampRating(NaN, 5, true) === 0`.
- [ ] Radiogroup named `Review score`; five radios `1 star` … `5 stars`; with
      `defaultValue={3}` the `3 stars` radio is checked and stars 1–3 are
      `data-fill="full"`, 4–5 `"empty"`.
- [ ] Hovering `4 stars` (value 2) sets `data-preview="4"`, fills 1–4, and
      does not call `onChange`; unhover removes `data-preview` and star 4 is
      empty again.
- [ ] Clicking `4 stars` calls `onChange(4)` and checks it (uncontrolled).
- [ ] Clicking the already-selected star calls `onChange(0)`; with
      `allowClear={false}` nothing is called. (The hover preview stays until
      the pointer leaves — the fill goes empty only after `mouseleave`.)
- [ ] Roving tabindex: only the checked star has `tabindex="0"`; with value 0
      the first star has it.
- [ ] `ArrowRight` from 3 → `onChange(4)` and `4 stars` has focus and is
      checked; `ArrowLeft` → 3; `End` → 5; `ArrowUp` at 5 → no `onChange`;
      `Home` → 1; `ArrowLeft` from 1 → 0 (no star checked, first star
      tabbable).
- [ ] With `allowHalf`, `ArrowRight` from 2 → 2.5: `3 stars` is checked with
      `data-fill="half"`.
- [ ] Senior: with `allowHalf` and `getBoundingClientRect` stubbed to
      `{ left: 100, width: 20 }`, a `mousemove` at `clientX 104` previews
      `N - 0.5` (`data-preview="2.5"` on star 3, star 3 `data-fill="half"`) and
      at `clientX 116` previews `3`; a click at `clientX 104` calls
      `onChange(2.5)`.
- [ ] Senior: `readOnly` renders `img` named `Rated 3.5 of 5`, no radios, and
      clicks / arrow keys never call `onChange`.
- [ ] Controlled: with `value={2}` and a spy, clicking `5 stars` calls
      `onChange(5)` but `2 stars` stays checked; re-rendering with `value={5}`
      checks `5 stars`.

## Baseline a11y

- `radiogroup` with an accessible name; `radio` children with `aria-checked`
  and a human label (`3 stars`, not `★`).
- One tab stop (roving tabindex); arrows change the value the way native
  radios do.
- Read-only ratings are a single `img` with a sentence label, not N
  decorative glyphs.

## Constraints

- React only; no rating libraries.
- Hover state must be internal and never flow through `onChange`.
- Use mouse events (`mousemove` / `mouseleave` / `click`) — jsdom 20 has no
  `PointerEvent`, and the tests fire `mousemove` with `clientX`.
- The glyph inside each star is decorative (`aria-hidden`); the name comes
  from `aria-label`.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The product wants a `name` prop so the rating posts in a plain `<form>`.
  Native hidden input, or `role="radio"` on real `<input type="radio">`s — what
  changes in the keyboard handling?
- RTL (right-to-left) locales: which arrow should increase, and how do you
  flip the half-star geometry?
- Touch devices have no hover. How do you expose the half step there (long
  press, second tap, a slider fallback)?
- The read-only `img` label hard-codes English. How would you make the label
  format injectable without a full i18n library?

## Say out loud

- State shape first: `internal` (ignored when `value` is given) and
  `preview: number | null`. Everything visual is `preview ?? value`;
  everything semantic (`aria-checked`, `tabIndex`) is the value only.
- Name the hazard: focus follows the value, but in controlled mode the parent
  may refuse the change — so move focus in an effect keyed on the rendered
  value, not in the key handler.
- Ask one data-shape question: is `value={2.5}` valid when `allowHalf` is off?
  (Decide: clamp it to the nearest integer via `clampRating`.)
- Ask one failure-handling question: `max={0}` or a negative `max` — render
  nothing, or throw in dev?
- Name the first test you would write: "hovering a star previews it and does
  not call `onChange`".
