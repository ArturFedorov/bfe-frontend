# 29. Kanban Board

**Difficulty:** Hard
**Topics:** Cross-column drag, optimistic updates, drop zone highlighting

---

## Description

Build a Kanban board with multiple columns of cards. The user can drag a card and drop it into another column (or reorder within the same column). Drop zones highlight while dragging over them. Updates are applied optimistically.

## Requirements

- Renders columns from an `Array<{ id, title, cards: Card[] }>`
- Each card is draggable (`draggable="true"`)
- Hovering a column while dragging adds a `drag-over` class
- Dropping a card on a column moves it to that column
- Dropping above an existing card inserts before it; dropping in empty space appends
- `getState()` returns the current columns/cards layout
- `moveCard(cardId, targetColumnId, targetIndex)` programmatically moves a card
- `onChange(state)` fires whenever the board changes
- `destroy()` removes elements and listeners

## Examples

```ts
const board = createKanbanBoard({
  container: document.getElementById('board')!,
  initialColumns: [
    { id: 'todo', title: 'Todo', cards: [{ id: 'c1', text: 'Write spec' }] },
    { id: 'doing', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ],
  onChange: (state) => console.log(state),
});

board.moveCard('c1', 'doing', 0);
```

## Approach Hints

<details>
<summary>Hint 1</summary>
On <code>dragstart</code>, store the dragged card's id in <code>event.dataTransfer.setData('text/plain', cardId)</code>. Read it on <code>drop</code> with <code>getData('text/plain')</code> — this also makes the drag survive cross-frame scenarios.
</details>

<details>
<summary>Hint 2</summary>
You MUST call <code>event.preventDefault()</code> on <code>dragover</code> in the drop zone — otherwise the browser refuses to fire <code>drop</code>. Easy thing to forget.
</details>

<details>
<summary>Hint 3</summary>
To compute the target insertion index within a column, look at <code>event.clientY</code> versus each existing card's <code>getBoundingClientRect()</code> midpoint. Insert before the first card whose midpoint is below the cursor, else append.
</details>
