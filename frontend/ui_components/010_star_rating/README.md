# 10. Star Rating

**Difficulty:** Easy  
**Topics:** DOM manipulation, event handling, CSS, state management

---

## Description

Build a star rating component. It renders a row of clickable stars. Clicking a star sets the rating. Hovering highlights stars up to the hovered position. The component supports read-only mode and configurable star count.

## Requirements

- Render a configurable number of stars (default 5) inside the container
- Clicking a star sets the rating to that star's position (1-indexed)
- Hovering over a star highlights it and all preceding stars
- `getRating()` returns the current rating
- `setRating(rating)` programmatically updates the rating
- `onChange` callback fires when the rating changes via click
- `readonly` mode prevents clicks from changing the rating
- `destroy()` removes all rendered elements and event listeners

## Examples

```ts
const container = document.getElementById('rating')!;

const rating = createStarRating({
  container,
  maxStars: 5,
  initialRating: 3,
  onChange: (value) => console.log('Rating:', value),
});

console.log(rating.getRating()); // 3
rating.setRating(5);
rating.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Create <code>span</code> or <code>button</code> elements for each star. Use a data attribute like <code>data-index</code> to track position. Use a CSS class like <code>filled</code> or <code>active</code> for visual state.
</details>

<details>
<summary>Hint 2</summary>
On <code>mouseenter</code> of a star, add the <code>active</code> class to all stars up to and including the hovered one. On <code>mouseleave</code> of the container, revert to showing only the current rating.
</details>

<details>
<summary>Hint 3</summary>
In <code>readonly</code> mode, skip adding click and hover event listeners entirely, or check the flag inside the handlers and return early.
</details>
