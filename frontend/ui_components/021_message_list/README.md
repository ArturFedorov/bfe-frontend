# 21. Real-Time Message List

**Difficulty:** Hard
**Topics:** Ordering, deduplication, scroll anchoring, real-time updates

---

## Description

Build a real-time chat-style message list. Messages arrive asynchronously and may be out of order, duplicated, or missing. The list must keep messages sorted by their sequence ID, drop duplicates, and intelligently anchor the scroll: stick to bottom when the user is already at the bottom, but stay put if the user has scrolled up to read history.

## Requirements

- `addMessages(messages)` accepts a batch of messages and inserts them in `seq` order
- Duplicate messages (same `id`) are ignored
- Out-of-order arrivals are placed at their correct sorted position (by `seq`)
- `getMessages()` returns the current ordered list
- When the user is scrolled to the bottom, new messages auto-scroll the container down
- When the user has scrolled up, new messages do **not** disturb the scroll position
- `destroy()` removes rendered elements and listeners

## Examples

```ts
const list = createMessageList({
  container: document.getElementById('chat')!,
  renderMessage: (m) => `<div data-id="${m.id}">${m.text}</div>`,
});

list.addMessages([
  { id: 'a', seq: 1, text: 'Hello' },
  { id: 'b', seq: 3, text: 'World' },
]);
list.addMessages([{ id: 'c', seq: 2, text: 'there' }]);

list.getMessages().map((m) => m.text); // ['Hello', 'there', 'World']
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Maintain a <code>Map&lt;id, message&gt;</code> for O(1) dedupe. Re-derive the ordered array by sorting on insertion, or keep a sorted array and binary-search for the insert index.
</details>

<details>
<summary>Hint 2</summary>
Detect "user is at the bottom" with <code>scrollHeight - scrollTop - clientHeight &lt; threshold</code> (e.g. 4px) <em>before</em> appending new nodes. After appending, only call <code>scrollTo</code> if the user was at the bottom.
</details>

<details>
<summary>Hint 3</summary>
For minimal re-renders, only insert the new DOM nodes — don't re-render the entire list. If a new message must appear in the middle, use <code>insertBefore</code> against the next-seq sibling.
</details>
