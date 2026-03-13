# 5. Infinite Scroll

**Difficulty:** Medium  
**Topics:** Scroll events, async/await, DOM manipulation, IntersectionObserver

---

## Description

Build an infinite scroll component that automatically loads more content when the user scrolls near the bottom of a container. It calls an async `loadMore` function, appends the returned elements, and shows a loading indicator.

## Requirements

- Call `loadMore()` when the user scrolls within the threshold of the container bottom
- Append returned elements to the container
- Show a loading indicator while `loadMore()` is in progress
- Stop loading if `loadMore()` returns an empty array (no more items)
- The `threshold` option (in pixels) controls how close to the bottom the trigger fires (default 100)
- `destroy()` removes scroll listeners and cleans up
- Do not call `loadMore()` while a previous load is still in progress

## Examples

```ts
const container = document.getElementById('feed')!;

const scroll = createInfiniteScroll({
  container,
  loadMore: async () => {
    const res = await fetch('/api/items?page=next');
    const data = await res.json();
    return data.map((item: any) => {
      const el = document.createElement('div');
      el.textContent = item.title;
      return el;
    });
  },
  threshold: 200,
});

// Later...
scroll.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Listen to the <code>scroll</code> event on the container. Check if <code>scrollTop + clientHeight >= scrollHeight - threshold</code> to determine if the user is near the bottom.
</details>

<details>
<summary>Hint 2</summary>
Use a boolean flag <code>isLoading</code> to prevent concurrent calls to <code>loadMore()</code>. Set it to true before calling and false after the promise resolves.
</details>

<details>
<summary>Hint 3</summary>
Create a loading element (e.g., a div with text "Loading...") and append/remove it from the container during load operations.
</details>
