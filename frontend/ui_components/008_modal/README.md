# 8. Modal

**Difficulty:** Medium  
**Topics:** DOM manipulation, focus management, keyboard events, accessibility

---

## Description

Build a modal/dialog component with overlay, close behavior, and focus trapping. The modal can be opened and closed programmatically, responds to Escape key and overlay clicks, and traps focus within the modal while open.

## Requirements

- `open()` shows the modal with an overlay backdrop
- `close()` hides the modal
- Pressing Escape closes the modal (configurable via `closeOnEsc`)
- Clicking the overlay closes the modal (configurable via `closeOnOverlay`)
- Focus is trapped inside the modal while open (Tab cycles through focusable elements)
- `onClose` callback fires when the modal is closed
- `destroy()` removes the modal from the DOM completely
- Content can be a string or an HTMLElement

## Examples

```ts
const content = document.createElement('div');
content.innerHTML = '<h2>Hello</h2><button>OK</button>';

const modal = createModal({
  content,
  onClose: () => console.log('Modal closed'),
  closeOnOverlay: true,
  closeOnEsc: true,
});

modal.open();
modal.close();
modal.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create an overlay div and a modal container div. Append the content inside the modal container. Toggle visibility of both on open/close.
</details>

<details>
<summary>Hint 2</summary>
For focus trapping, find all focusable elements inside the modal (buttons, inputs, links, etc.). On Tab keydown, if focus is on the last element, move it to the first, and vice versa for Shift+Tab.
</details>

<details>
<summary>Hint 3</summary>
Listen for <code>keydown</code> on the document for Escape, and <code>click</code> on the overlay. Only attach these listeners when the modal is open and remove them on close.
</details>
