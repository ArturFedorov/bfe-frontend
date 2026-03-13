# 15. Progress Bar

**Difficulty:** Easy  
**Topics:** DOM manipulation, CSS transitions, clamping

---

## Description

Build a progress bar component that visually represents a percentage value (0–100). The bar fills proportionally, and an optional `animated` mode adds a CSS class for transition effects.

## Requirements

- Render a progress bar container with an inner fill element
- `setValue(value)` sets the progress percentage and updates the fill width
- Values are clamped to the range 0–100
- `getValue()` returns the current progress value
- When `animated` is `true`, the fill element has an `animated` CSS class
- `initialValue` sets the starting progress (default `0`)
- `destroy()` removes all DOM content from the container

## Examples

```ts
const container = document.getElementById('progress')!;

const bar = createProgressBar({
  container,
  initialValue: 30,
  animated: true,
});

bar.setValue(80);
console.log(bar.getValue()); // 80
bar.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create an outer <code>div</code> for the track and an inner <code>div</code> for the fill. Set the fill's <code>width</code> style as a percentage of the current value.
</details>

<details>
<summary>Hint 2</summary>
Use <code>Math.min(100, Math.max(0, value))</code> to clamp. Update the inner div's <code>style.width</code> on every <code>setValue</code> call.
</details>

<details>
<summary>Hint 3</summary>
The <code>animated</code> class can be used by consumers to apply CSS transitions (e.g., <code>transition: width 0.3s ease</code>). Just toggle the class based on the option.
</details>
