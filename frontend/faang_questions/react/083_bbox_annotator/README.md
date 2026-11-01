# 083. Bounding-Box Annotator

**Difficulty:** Very Hard
**Estimated time:** 60 min
**Topics:** Pointer Events, Pointer Capture, SVG Overlay, Coordinate Spaces (zoom/pan), Controlled Component, Keyboard Editing

---

## Scenario

Photo-labelling annotators on the ML data-annotation platform draw bounding boxes over
images that can be several thousand pixels wide, so the viewer zooms and pans while the
labels must be stored in **image pixels** — a box drawn at zoom 2 must land on the same
pixels as one drawn at zoom 0.5. The first version stored screen coordinates (boxes
drifted whenever the zoom changed), lost the drag when the pointer left the svg, and had
no keyboard path, which failed the accessibility review. Build `BBoxAnnotator`: an svg
overlay for drawing, moving, resizing and nudging boxes, fully controlled through
`value`/`onChange`, with every coordinate converted to image space.

## Requirements

1. Render `<svg role="application" aria-label="Bounding boxes">` sized to `viewport`,
   containing a `<g transform>` that applies `pan` (translate, screen px) and `zoom`
   (scale). Boxes are rendered inside that group with their **image-space** `x`, `y`,
   `width`, `height` — zoom/pan never rewrites box coordinates.
2. Each box is a `<rect role="button" aria-label="Box <id>" tabIndex={0}>`. When a box is
   selected (pointerdown on it or focus), render 8 resize handles, each a
   `<rect role="button" aria-label="Resize Box <id> <handle>" data-handle="n|ne|e|se|s|sw|w|nw">`.
   No handles are shown for unselected boxes.
3. Export two pure helpers and use them in the component:
   `toImageSpace(point, zoom, pan)` → `(point − pan) / zoom`, and
   `clampBox(box, imageWidth, imageHeight)` → size capped to the image, then position
   clamped so the box lies fully inside `[0, imageWidth] × [0, imageHeight]`.
4. Drawing: pointerdown on empty canvas (the svg itself or the image background) starts a
   draft; pointermove updates it; pointerup commits a new box via `onChange([...value, box])`
   with a generated `id`. The draft is normalized (drag in any direction) and clamped to
   the image. A result narrower or shorter than 2 image px is discarded (no `onChange`).
   Drawing must call `onChange` only on commit, not while dragging.
5. Moving: pointerdown on a box, then pointermove, moves it by the image-space delta;
   `onChange` is called with the clamped box on every move so the parent stays the source
   of truth.
6. Resizing: pointerdown on a handle resizes the corresponding edges/corner. Dragging past
   the opposite edge flips the box (never negative width/height). Result is clamped.
7. Screen → image conversion uses the svg's `getBoundingClientRect()` origin and the
   current `zoom`/`pan` for every pointer event.
8. Pointer capture: call `setPointerCapture(pointerId)` on the svg on pointerdown and
   `releasePointerCapture` when the drag ends or is cancelled. Ignore moves from a
   different `pointerId`.
9. Escape during a drag cancels it: a move/resize restores the pre-drag box via
   `onChange`, a draw discards its draft; subsequent pointermove/pointerup for that drag
   are ignored.
10. Keyboard, with a box focused: ArrowLeft/Right/Up/Down nudge by 1 image px, with Shift
    by 10, always clamped; Delete (or Backspace) removes the box. Nothing happens when no
    box is selected.
11. Fully controlled: the component renders exactly `value`; if the parent ignores
    `onChange` nothing moves. No internal copy of the boxes.

## Acceptance Criteria

- [ ] `toImageSpace` and `clampBox` behave as specified (unit-tested directly).
- [ ] One `button` rect per box named `Box <id>`, positioned in image space; `<g>` carries
      `translate(pan) scale(zoom)`.
- [ ] 8 handles appear only for the selected box.
- [ ] Draw commits a normalized, clamped box; tiny drags are discarded; at zoom 2 a 40px
      screen drag yields a 20px image box.
- [ ] Move follows the pointer in image space and clamps to the bounds.
- [ ] Resize via `se` grows, via `nw` moves the origin, via `w` past the east edge flips.
- [ ] `setPointerCapture`/`releasePointerCapture` are called with the pointer id.
- [ ] Escape restores the pre-drag box and later events of that drag are ignored.
- [ ] Arrow/Shift+Arrow nudge and clamp; Delete removes only the focused box.
- [ ] Ignoring `onChange` in the parent leaves the rendering unchanged.

## Baseline a11y

- The canvas is `role="application"` with `aria-label="Bounding boxes"` and is focusable.
- Every box is a focusable `role="button"` named `Box <id>`; selection follows focus so
  keyboard users can reach every box with Tab and edit it with the arrow keys.
- Handles are named (`Resize Box <id> <handle>`) so they are discoverable by AT.
- All interactions are available without a pointer: nudge (arrows), delete (Delete).

## Constraints

- No third-party libraries. Pointer Events only (no mouse/touch handlers).
- Boxes are stored in image space; never store screen coordinates.
- Pure helpers must not touch the DOM.

## Interviewer follow-ups (talk-through, not implemented)

- Pinch/ wheel zoom around the cursor: how do you update `pan` so the image point under
  the cursor stays put, and where does that state live (parent vs. annotator)?
- 2000 boxes on screen: what re-renders on each pointermove, and how would you cut it
  (memoized box rows, a transient drag layer outside React state, `requestAnimationFrame`
  throttling)?
- Undo/redo for drags: coalesce the stream of `onChange` calls during one drag into a
  single history entry (see 082 `command_stack_undo`).
- Model-assisted suggestions: pre-drawn low-confidence boxes with accept/reject, rendered
  in a different style and excluded from keyboard focus until accepted.

## Say out loud

- State shape first: `drag: null | { kind: 'draw' | 'move' | 'resize', pointerId, start, original }`
  plus `selectedId`; boxes themselves live in the parent (`value`).
- Race/cleanup hazard: the drag's pointer capture and the Escape listener must be released
  on pointerup, on Escape, and on unmount; moves from another pointer id are ignored.
- Data-shape question: is `pan` in screen px or image px, and is `zoom` ever non-uniform?
- Failure-handling question: what should happen if `onChange` rejects a box (parent
  clamps differently or discards)? The rendered value is whatever the parent returns.
- First test you'd write: `toImageSpace({x:110,y:70}, 2, {x:10,y:20})` equals `{50,25}`.
