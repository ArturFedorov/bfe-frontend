# 2. Color Picker

**Difficulty:** Medium  
**Topics:** DOM manipulation, event handling, CSS colors, state management

---

## Description

Build a color swatch picker component. It renders a grid of color swatches inside a container. Clicking a swatch selects that color. The component provides methods to get/set the current color and fires a callback on change.

## Requirements

- Render a grid of predefined color swatches inside the container
- Clicking a swatch updates the selected color and visually highlights it
- `getColor()` returns the currently selected hex color string
- `setColor(color)` programmatically updates the selection
- `onChange` callback fires whenever the color changes
- `destroy()` removes all rendered elements and event listeners
- Support an optional `initialColor` to pre-select a swatch

## Examples

```ts
const container = document.getElementById('picker')!;

const picker = createColorPicker({
  container,
  initialColor: '#ff0000',
  onChange: (color) => console.log('Color changed:', color),
});

console.log(picker.getColor()); // '#ff0000'
picker.setColor('#00ff00');
picker.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Define a palette array of hex colors. For each color, create a <code>div</code> element styled with <code>backgroundColor</code> and attach a click listener.
</details>

<details>
<summary>Hint 2</summary>
Track the selected color in a variable. When a swatch is clicked or <code>setColor</code> is called, update the variable and toggle an <code>active</code> class on the correct swatch.
</details>

<details>
<summary>Hint 3</summary>
In <code>destroy()</code>, remove the entire rendered element tree from the container and remove any event listeners you attached.
</details>
