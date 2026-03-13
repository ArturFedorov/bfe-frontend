# 12. Tabs

**Difficulty:** Medium  
**Topics:** DOM manipulation, event handling, keyboard navigation, ARIA

---

## Description

Build a tab component that displays a row of tab buttons and shows the content panel corresponding to the active tab. The component supports mouse clicks and keyboard navigation (left/right arrows) to switch between tabs.

## Requirements

- Render a tab bar with one button per tab and a content area below
- Clicking a tab button activates that tab and displays its content
- Only one tab can be active at a time
- Arrow Left/Right keys move focus and activate adjacent tabs (wrapping around)
- The `setActive(index)` method programmatically selects a tab
- The `getActive()` method returns the currently active tab index
- The `defaultIndex` option sets which tab is active on creation (default `0`)
- The `destroy()` method removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('tabs')!;

const tabs = createTabs({
  container,
  tabs: [
    { label: 'Tab 1', content: 'Content for tab 1' },
    { label: 'Tab 2', content: 'Content for tab 2' },
  ],
  defaultIndex: 0,
});

tabs.setActive(1);
console.log(tabs.getActive()); // 1
tabs.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create a <code>div</code> for the tab bar and another <code>div</code> for the content area. Each tab button should be a <code>button</code> element with a <code>role="tab"</code> attribute.
</details>

<details>
<summary>Hint 2</summary>
Listen for <code>keydown</code> events on the tab bar. On ArrowLeft, move to the previous tab (wrapping to the last); on ArrowRight, move to the next tab (wrapping to the first).
</details>

<details>
<summary>Hint 3</summary>
Keep a single <code>activeIndex</code> variable. When it changes, update the <code>aria-selected</code> attribute and toggle a CSS class like <code>active</code> on the buttons, and swap the displayed content.
</details>
