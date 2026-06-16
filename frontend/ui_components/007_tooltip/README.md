# 7. Tooltip

**Difficulty:** Easy  
**Topics:** DOM manipulation, event handling, CSS positioning, timers

---

## Description

Build a tooltip component that shows a floating text popup when hovering over a target element. The tooltip supports configurable position and show delay.

## Requirements

- Show tooltip on mouseenter of the target element
- Hide tooltip on mouseleave of the target element
- Tooltip content is rendered as text inside the tooltip element
- Position the tooltip relative to the target (`top`, `bottom`, `left`, `right`)
- Apply a CSS class matching the position (e.g., `tooltip-top`)
- Support a configurable delay before showing
- `show()` and `hide()` methods for programmatic control
- `destroy()` removes the tooltip element and all event listeners

## Examples

```ts
const button = document.querySelector<HTMLElement>('#my-button')!;

const tooltip = createTooltip({
  target: button,
  content: 'Click me!',
  position: 'top',
  delay: 200,
});

tooltip.show();
tooltip.hide();
tooltip.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create a <code>div</code> element for the tooltip, set its text content, and append it to <code>document.body</code>. Toggle its visibility with a CSS class or <code>display</code> property.
</details>

<details>
<summary>Hint 2</summary>
Use <code>setTimeout</code> for the delay. Store the timeout ID so you can clear it on <code>mouseleave</code> to cancel a pending show.
</details>

<details>
<summary>Hint 3</summary>
Add a data attribute or class like <code>tooltip-top</code> based on the position option. This lets CSS handle the actual positioning.
</details>

---

## React Implementation Task

A runnable React playground is wired up for this component. Implement it
alongside the vanilla version above.

- **Component to implement:** [`react/Tooltip.tsx`](./react/Tooltip.tsx) — currently a placeholder.
- **Demo harness:** [`react/App.tsx`](./react/App.tsx) — renders the component; adjust the sample props as you go.

### Run it

From `frontend/ui_components/`:

```bash
npm install   # first time only
npm run dev
```

Then open the dev server and pick **Tooltip** from the sidebar.

### Goal

Re-implement the component in **idiomatic React** so it meets the same
requirements described above. Edit `react/Tooltip.tsx`; keep its exported props
stable so the harness keeps working.

