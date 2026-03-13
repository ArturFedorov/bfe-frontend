# 1. Autocomplete

**Difficulty:** Medium  
**Topics:** DOM manipulation, event handling, debounce, keyboard navigation

---

## Description

Build an autocomplete/typeahead component that attaches to an existing `<input>` element. As the user types, a dropdown list of suggestions appears filtered by the input query. The component supports keyboard navigation and debounced input.

## Requirements

- Render a dropdown list of matching suggestions below the input as the user types
- Filter suggestions case-insensitively based on the current input value
- Clicking a suggestion selects it, fills the input, and closes the dropdown
- Support keyboard navigation: Arrow Up/Down to highlight suggestions, Enter to select
- Debounce input events by a configurable delay (default 300ms)
- Calling `destroy()` removes all event listeners and cleans up the DOM
- Show nothing when the query is empty or no results match

## Examples

```ts
const input = document.querySelector<HTMLInputElement>('#search')!;

const ac = createAutocomplete({
  input,
  data: ['Apple', 'Banana', 'Avocado', 'Blueberry', 'Cherry'],
  onSelect: (value) => console.log('Selected:', value),
  debounceMs: 200,
});

// Later...
ac.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create a container element (e.g., a <code>ul</code>) positioned below the input to hold suggestion items. Use <code>position: absolute</code> relative to the input's parent.
</details>

<details>
<summary>Hint 2</summary>
Maintain an <code>activeIndex</code> to track which suggestion is highlighted. Update it on ArrowUp/ArrowDown and use it to apply a CSS class for visual feedback.
</details>

<details>
<summary>Hint 3</summary>
Implement debounce by storing a <code>setTimeout</code> ID and clearing it on each new input event before setting a new timeout.
</details>
