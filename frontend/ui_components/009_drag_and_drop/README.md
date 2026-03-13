# 9. Drag and Drop Sortable List

**Difficulty:** Hard  
**Topics:** Drag events, DOM manipulation, reordering, event handling

---

## Description

Build a drag-and-drop sortable list. Items can be reordered by dragging them to a new position. The component uses the HTML Drag and Drop API and fires a callback when the order changes.

## Requirements

- Render a list of draggable items inside the container
- Items can be dragged and dropped to reorder them
- `getItems()` returns the current order of items
- `onReorder` callback fires with the new order when items are rearranged
- Each item should have `draggable="true"` attribute
- `destroy()` removes all event listeners and cleans up
- Visual feedback during drag (e.g., a CSS class on the dragged item)

## Examples

```ts
const container = document.getElementById('list')!;

const sortable = createSortable({
  container,
  items: ['Item 1', 'Item 2', 'Item 3'],
  onReorder: (newOrder) => console.log('New order:', newOrder),
});

console.log(sortable.getItems()); // ['Item 1', 'Item 2', 'Item 3']
sortable.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create a <code>div</code> (or <code>li</code>) for each item with <code>draggable="true"</code>. Store the item's index or value in a <code>data-</code> attribute.
</details>

<details>
<summary>Hint 2</summary>
Use <code>dragstart</code>, <code>dragover</code>, <code>dragenter</code>, and <code>drop</code> events. In <code>dragstart</code>, store the dragged item. In <code>dragover</code>/<code>dragenter</code>, call <code>e.preventDefault()</code> to allow dropping.
</details>

<details>
<summary>Hint 3</summary>
On <code>drop</code>, determine the target position and rearrange the DOM nodes. Then update your internal items array and call <code>onReorder</code>.
</details>
