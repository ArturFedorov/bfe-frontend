# 23. Multi-Select Dropdown

**Difficulty:** Hard
**Topics:** Combobox a11y, search filter, keyboard nav, controlled state

---

## Description

Build a multi-select dropdown with search. The user can open the menu, type to filter, toggle multiple options with click or Space, and navigate with the arrow keys. Selected values are shown as chips/tags above or inside the trigger.

## Requirements

- Click trigger opens/closes the menu (`aria-expanded` updates)
- Typing filters options by case-insensitive substring match
- Click on an option toggles selection
- Up/Down arrow keys move active descendant; `aria-activedescendant` reflects it
- Enter or Space toggles the active option
- Escape closes the menu
- `getSelected()` returns the currently selected values
- `setSelected(values)` programmatically updates selection
- `onChange(values)` fires whenever selection changes
- Click outside the component closes the menu
- `destroy()` removes elements and listeners

## Examples

```ts
const select = createMultiSelect({
  container: document.getElementById('select')!,
  options: [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
  ],
  onChange: (vals) => console.log(vals),
});

select.setSelected(['js']);
select.getSelected(); // ['js']
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Use the combobox a11y pattern: a trigger with <code>role="combobox"</code>, <code>aria-expanded</code>, and <code>aria-controls</code> pointing at a <code>role="listbox"</code> with <code>aria-multiselectable="true"</code>.
</details>

<details>
<summary>Hint 2</summary>
Track <code>activeIndex</code> in the filtered list separately from the selection set. Arrow keys move <code>activeIndex</code>; selection is a <code>Set&lt;string&gt;</code> toggled on Enter/Space/click.
</details>

<details>
<summary>Hint 3</summary>
For "click outside closes", attach a <code>mousedown</code> listener on <code>document</code> when the menu opens and check <code>!container.contains(event.target)</code>. Remove it when the menu closes to avoid leaks.
</details>
