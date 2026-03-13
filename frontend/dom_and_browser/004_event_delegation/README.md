# 4. Event Delegation

**Difficulty:** Medium
**Topics:** DOM Events, Event Delegation, Event Bubbling

---

## Description

Implement an event delegation system. The `delegate` function attaches a single event listener to a `parent` element. When the event fires, it checks if the event target (or any of its ancestors up to the parent) matches the given CSS `selector`. If so, it invokes the `handler`.

The function returns an object with a `remove()` method that stops the delegation.

## Examples

```ts
const cleanup = delegate(document.body, ".btn", "click", (e) => {
  console.log("Button clicked!", e.target);
});

// Later, to stop listening:
cleanup.remove();
```

## Constraints

- `parent` is a DOM element with `addEventListener` and `removeEventListener`
- `selector` is a simple CSS selector (tag, class, or id)
- `handler` receives the original event object
- `remove()` must completely stop the delegation
- The handler should fire if the target or any of its ancestors (up to parent) match the selector

## Approach Hints

<details>
<summary>Hint 1</summary>
Attach a single event listener on the parent. Inside the listener, use `event.target` and walk up with `parentNode` or use `matches()` to check the selector.
</details>

<details>
<summary>Hint 2</summary>
Use `element.matches(selector)` to check if an element matches the CSS selector. Walk up from `event.target` to `parent`.
</details>

<details>
<summary>Hint 3</summary>
Store the listener function so `remove()` can call `removeEventListener` with the exact same reference.
</details>
