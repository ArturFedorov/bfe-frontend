# 13. Slider

**Difficulty:** Medium  
**Topics:** DOM manipulation, mouse events, pointer tracking, clamping

---

## Description

Build a slider (range input) component that allows users to select a numeric value by dragging a thumb along a track. The component supports configurable min, max, step values, and fires a callback on change.

## Requirements

- Render a slider track and a draggable thumb element inside the container
- Dragging the thumb changes the value proportional to the position on the track
- The value is clamped between `min` (default `0`) and `max` (default `100`)
- The value snaps to the nearest `step` increment (default `1`)
- The `onChange` callback is invoked whenever the value changes
- `getValue()` returns the current slider value
- `setValue(value)` updates the slider position and value programmatically
- `destroy()` removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('slider')!;

const slider = createSlider({
  container,
  min: 0,
  max: 100,
  step: 5,
  initialValue: 50,
  onChange: (value) => console.log('Value:', value),
});

slider.setValue(75);
console.log(slider.getValue()); // 75
slider.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create a track element and a thumb element. Position the thumb absolutely within the track based on the current value's percentage: <code>(value - min) / (max - min) * 100</code>.
</details>

<details>
<summary>Hint 2</summary>
On <code>mousedown</code> on the thumb, attach <code>mousemove</code> and <code>mouseup</code> listeners to <code>document</code>. Calculate the new value from the mouse position relative to the track's bounding rect.
</details>

<details>
<summary>Hint 3</summary>
To snap to step: <code>Math.round((rawValue - min) / step) * step + min</code>. Then clamp the result between min and max.
</details>

---

## React Implementation Task

A runnable React playground is wired up for this component. Implement it
alongside the vanilla version above.

- **Component to implement:** [`react/Slider.tsx`](./react/Slider.tsx) — currently a placeholder.
- **Demo harness:** [`react/App.tsx`](./react/App.tsx) — renders the component; adjust the sample props as you go.

### Run it

From `frontend/ui_components/`:

```bash
npm install   # first time only
npm run dev
```

Then open the dev server and pick **Slider** from the sidebar.

### Goal

Re-implement the component in **idiomatic React** so it meets the same
requirements described above. Edit `react/Slider.tsx`; keep its exported props
stable so the harness keeps working.

