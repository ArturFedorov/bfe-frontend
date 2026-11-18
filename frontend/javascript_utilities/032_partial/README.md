# 32. Implement Partial Application

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Functional Programming, Closures

---

## Description

Implement `partial`, which fixes some leading arguments of a function and returns a new function that takes the rest. Export a placeholder symbol `_` so callers can leave gaps that are filled, left to right, by the arguments of the later call.

```typescript
const _: unique symbol;

function partial<T extends (...args: any[]) => any>(
  fn: T,
  ...presetArgs: unknown[]
): (...args: unknown[]) => ReturnType<T>;
```

Rules:

- Placeholders are replaced in order by the call-time arguments
- Call-time arguments left over after filling every placeholder are appended
- A placeholder with no argument to fill it becomes `undefined`
- `this` from the call is forwarded to `fn`

---

## Examples

### Example 1

```typescript
const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
const hello = partial(greet, 'Hello');

hello('Ada'); // 'Hello, Ada!'
```

### Example 2

```typescript
const subtract = (a: number, b: number) => a - b;
const subtractFrom10 = partial(subtract, _, 10);

subtractFrom10(3); // subtract(3, 10) = -7
```

### Example 3

```typescript
const join = (...parts: string[]) => parts.join('-');
const fill = partial(join, _, 'b', _, 'd');

fill('a', 'c', 'e'); // join('a', 'b', 'c', 'd', 'e') = 'a-b-c-d-e'
```

---

## Constraints

- `_` must never reach `fn`
- The preset arguments must not be mutated; the partial function is reusable
- Partials can be nested: `partial(partial(fn, 1), 2)`

---

## Approach Hints

<details><summary>Hint 1</summary>
Use `Symbol('placeholder')` for `_` so no real argument can collide with it.
</details>

<details><summary>Hint 2</summary>
At call time, walk `presetArgs` and copy each item into a fresh array, replacing each placeholder with the next call argument. Keep an index into the call arguments.
</details>

<details><summary>Hint 3</summary>
Append whatever call arguments remain after the walk, then `fn.apply(this, finalArgs)`.
</details>

---

## Related Problems

- Implement Curry
- Implement Function.prototype.bind
