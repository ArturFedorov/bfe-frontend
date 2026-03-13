# 18. Implement Curry

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Closures, Functional Programming

---

## Description

Implement a `curry` function that transforms a function so it can be called with fewer arguments than it expects. It returns a new function that accepts the remaining arguments. When all arguments are provided, the original function is invoked.

```typescript
function curry(fn: Function): Function
```

---

## Examples

### Example 1
```typescript
const add = curry((a: number, b: number) => a + b);
add(1)(2); // 3
add(1, 2); // 3
```

### Example 2
```typescript
const sum3 = curry((a: number, b: number, c: number) => a + b + c);
sum3(1)(2)(3); // 6
sum3(1, 2)(3); // 6
sum3(1)(2, 3); // 6
```

---

## Constraints

- Support any number of arguments
- Allow partial application at any step
- If all arguments are provided at once, invoke immediately

---

## Approach Hints

<details><summary>Hint 1</summary>
Use `fn.length` to know how many arguments the function expects.
</details>

<details><summary>Hint 2</summary>
Return a new function that accumulates arguments until enough are collected.
</details>

<details><summary>Hint 3</summary>
Use recursion or a helper that tracks collected arguments.
</details>

---

## Related Problems

- Implement Partial Application
- Implement Function Composition
