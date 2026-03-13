# 11. Accordion

**Difficulty:** Easy  
**Topics:** DOM manipulation, event handling, CSS classes, state management

---

## Description

Build an accordion/collapsible sections component. Each section has a clickable header that toggles its content panel open or closed. By default, only one section can be open at a time (single mode), but an `allowMultiple` option enables keeping multiple sections open simultaneously.

## Requirements

- Render a list of accordion sections with clickable headers and content panels
- Clicking a header toggles the corresponding content panel open/closed
- In single mode (default), opening a section closes all other sections
- When `allowMultiple` is `true`, opening a section does not close others
- The `toggle(index)` method programmatically toggles a section
- The `destroy()` method removes all event listeners and cleans up the DOM
- Open sections should have an `active` class on their header element

## Examples

```ts
const container = document.getElementById('accordion')!;

const accordion = createAccordion({
  container,
  items: [
    { title: 'Section 1', content: 'Content for section 1' },
    { title: 'Section 2', content: 'Content for section 2' },
    { title: 'Section 3', content: 'Content for section 3' },
  ],
  allowMultiple: false,
});

accordion.toggle(0); // Opens section 0
accordion.destroy(); // Cleans up
```

## Approach Hints

<details>
<summary>Hint 1</summary>
For each item, create a header element and a content element. Use a CSS class or <code>style.display</code> to show/hide the content panel.
</details>

<details>
<summary>Hint 2</summary>
Maintain an array or set of open indices. In single mode, clear the set before adding the new index. In multiple mode, just toggle the index in the set.
</details>

<details>
<summary>Hint 3</summary>
Store references to all click handlers so you can remove them in <code>destroy()</code>. Also clear the container's innerHTML on destroy.
</details>
