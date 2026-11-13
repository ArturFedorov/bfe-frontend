# 103. Image Carousel

**Difficulty:** Medium
**Estimated time:** 35 min
**Topics:** WAI-ARIA carousel pattern, autoplay with pause-on-hover/focus, timers and cleanup, lazy slide rendering, pointer swipe, controlled vs uncontrolled

---

## Scenario

Reviewers in the media-operations console flip through a title's key art
(poster, banner, thumbnails) before approving it. The current widget mounts
every image up front (a 40-slide gallery downloads 40 hero images), autoplays
forever even while someone is reading the caption, and the only way to change
slides is clicking two tiny arrows. Accessibility review flagged: no landmark,
no live announcement of the current slide, and the arrows have no names.

Build `<Carousel>` following the WAI-ARIA carousel pattern: one visible slide,
named controls, a live status line, keyboard arrows, autoplay that pauses while
the user is engaged, lazy rendering of only the current slide and its
neighbours, and a basic pointer swipe.

## Contract

```tsx
// carousel.tsx
export interface Slide { id: string; src: string; alt: string }

<Carousel
  slides={Slide[]}
  autoPlayMs?={number}    // default 0 = off; > 0 advances every autoPlayMs
  loop?={boolean}         // default true; false disables wrap and the end buttons
  index?={number}         // controlled active index
  defaultIndex?={number}  // uncontrolled start index, default 0
  onChange?={(index: number) => void}
  label?={string}         // accessible name, default 'Gallery'
/>
```

### DOM shape (the tests query exactly this)

- Root: `role="region"` with `aria-roledescription="carousel"` and
  `aria-label` = `label` (default `Gallery`). The root has `tabIndex={0}` so
  it can take focus for the arrow keys.
- Slides: each rendered slide is `role="group"` with
  `aria-roledescription="slide"` and `aria-label="N of M"` (1-based), containing
  one `<img src alt>`. Only the active slide is visible; the other rendered
  slides carry the `hidden` attribute.
- **Lazy**: only the active slide and its immediate neighbours are in the DOM
  (with `loop` the neighbours wrap, so index 0 of 5 renders slides 5, 1, 2).
  Slides further away are not rendered at all.
- Buttons: `<button aria-label="Previous">` and `<button aria-label="Next">`.
  With `loop={false}` Previous is `disabled` on the first slide and Next on the
  last.
- Dots: one `<button aria-label="Go to slide N">` per slide; the active dot has
  `aria-current="true"`, the others no `aria-current`.
- Status: an element with `role="status"` whose text is `Slide N of M`.

## Requirements

1. **Region, slide, status.** The roles/labels above; exactly one non-hidden
   slide at any time; the status text tracks the active slide.
2. **Buttons and dots.** Previous / Next step by one; with `loop` they wrap,
   without it they are disabled at the ends. A dot jumps straight to its slide
   and takes `aria-current`.
3. **Keyboard.** `ArrowLeft` / `ArrowRight` pressed anywhere inside the region
   (the region itself or one of its buttons) navigate like Previous / Next.
   `preventDefault` on handled keys.
4. **Autoplay.** When `autoPlayMs > 0`, advance one slide every `autoPlayMs`
   (`setInterval` or chained `setTimeout`). Autoplay **pauses** while the
   pointer is over the region (`pointerenter` … `pointerleave`) or focus is
   inside it, and **resumes** on leave / blur with a fresh full interval. With
   `loop={false}` autoplay stops at the last slide. Unmount clears the timer —
   no `onChange` or state update after unmount.
5. **Lazy rendering.** Only active ± 1 slides are mounted (see DOM shape); a
   gallery of 5 never has more than 3 `<img>` elements.
6. **Swipe.** `pointerdown` on the region records `clientX`; `pointermove`
   tracks; `pointerup` with a horizontal delta of **40px or more** goes Next
   (moved left) or Previous (moved right). Smaller moves do nothing.
7. **Controlled / uncontrolled.** Without `index`, the component owns the index
   (start at `defaultIndex`) and calls `onChange(next)` on every change. With
   `index`, it never changes on its own — it only calls `onChange(next)` and
   renders the prop.

## Acceptance Criteria

- [ ] `region` named `Gallery` with `aria-roledescription="carousel"`; the one
      visible `group` is labelled `1 of 5`; `status` reads `Slide 1 of 5`.
- [ ] Next shows `2 of 5` and updates status; Previous returns to `1 of 5`.
- [ ] With `loop` (default) Previous on the first slide shows the last slide and
      Next on the last shows the first.
- [ ] With `loop={false}` Previous is disabled on slide 1 and Next on slide 5;
      ArrowRight on the last slide does nothing.
- [ ] Dot `Go to slide 4` jumps to slide 4 and is the only dot with
      `aria-current="true"`.
- [ ] `ArrowRight` with focus on the region advances; `ArrowLeft` with focus on
      the Next button goes back.
- [ ] Autoplay with fake timers: `autoPlayMs={1000}` → after 1000ms slide 2,
      after another 1000ms slide 3; `onChange` is called each time.
- [ ] Senior: while the pointer is over the region, 3000ms pass with no change;
      after `pointerleave`, the next advance happens 1000ms later (not sooner).
- [ ] Focus inside the region (on the Next button) pauses autoplay; blurring
      out resumes it.
- [ ] Senior: exactly 3 `<img>` elements for a 5-slide gallery, and the three
      rendered groups are the active one and its two neighbours (wrapping at
      the ends with `loop`); with `loop={false}` on slide 1 only 2 images.
- [ ] Swipe: `pointerdown` at `clientX 200`, `pointermove` to `150`, `pointerup`
      → next slide; a 20px move does nothing; swiping right goes back.
- [ ] Senior: unmounting with autoplay running leaves no pending timers and
      `onChange` is not called again after further time advances.
- [ ] Controlled: with `index={2}` and a spy `onChange`, Next calls
      `onChange(3)` but the UI stays on `3 of 5`; when the parent re-renders
      with `index={3}` the UI follows.

## Baseline a11y

- WAI-ARIA carousel: `region` + `aria-roledescription="carousel"`, slides as
  `group` + `aria-roledescription="slide"` with a position label.
- Named Previous / Next / dot buttons; `aria-current` on the active dot.
- Polite `role="status"` announcing `Slide N of M` on change.
- Autoplay never runs while the user is hovering or focused inside — this is
  the WCAG 2.2.2 (Pause, Stop, Hide) requirement.

## Constraints

- React only; no carousel or gesture libraries.
- Inactive rendered slides use the `hidden` attribute, not inline
  `display: none`.
- Do not call `setPointerCapture` without guarding — jsdom does not implement
  it. (The test file polyfills `PointerEvent` for jsdom 20; your component must
  read `clientX` from the event, nothing else.)
- No `document.addEventListener` for keys — handle `onKeyDown` on the region.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The design wants a sliding animation between neighbours. How does the lazy
  "active ± 1" rendering make that possible, and what breaks when the user jumps
  via a dot from slide 1 to slide 4?
- `prefers-reduced-motion` is on. What changes for autoplay and for the slide
  transition? Where does that check live?
- Add a visible Play / Pause toggle. How does an explicit user pause interact
  with the automatic hover/focus pause (two booleans, or a state machine)?
- Images are 4MB each. How would you preload the next neighbour without
  mounting it in the DOM?

## Say out loud

- State shape first: `index` (internal unless controlled), `hovered` and
  `focusWithin` booleans; `paused = hovered || focusWithin`. The autoplay
  effect depends on `[autoPlayMs, paused, loop, index]` so resuming always
  restarts a full interval.
- Name the hazard: stale closures in the interval callback. Either put `index`
  in the effect deps and reset the timer every tick, or use a functional update
  — but in controlled mode you must read the latest `index` prop, so a ref is
  the safest.
- Ask one data-shape question: can `slides` be empty? (Decide: render the
  region with status `Slide 0 of 0` and disabled buttons.)
- Ask one failure-handling question: what if `defaultIndex` is out of range —
  clamp or throw?
- Name the first test you would write: "autoplay pauses while hovered and
  resumes with a full interval after leave".
