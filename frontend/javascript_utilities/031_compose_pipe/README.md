# 31. Implement Compose and Pipe

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Functional Programming, Higher-Order Functions

---

## Description

Implement `compose` and `pipe`, the two classic ways to build a function out of smaller functions.

- `compose(f, g, h)(x)` applies **right to left**: `f(g(h(x)))`
- `pipe(f, g, h)(x)` applies **left to right**: `h(g(f(x)))`

The first function to run may accept any number of arguments; every function after it receives exactly one argument, the previous result. Calling with zero functions returns an identity function that returns its first argument. Nothing is invoked at composition time.

```typescript
type AnyFn = (...args: any[]) => any;

function compose(...fns: AnyFn[]): AnyFn;
function pipe(...fns: AnyFn[]): AnyFn;
```

---

## Examples

### Example 1

```typescript
const double = (n: number) => n * 2;
const inc = (n: number) => n + 1;

compose(double, inc)(5); // double(inc(5)) = 12
pipe(double, inc)(5); // inc(double(5)) = 11
```

### Example 2

```typescript
const add = (a: number, b: number) => a + b;
const toLabel = pipe(add, String, (s: string) => `#${s}`);

toLabel(2, 3); // '#5'
```

### Example 3

```typescript
compose()(42); // 42
pipe()(1, 2); // 1
```

---

## Constraints

- Support any number of functions, including zero
- Only the first function to run may receive multiple arguments
- Pass the previous return value as a single argument, even when it is an array
- Do not call any function until the composed function is invoked

---

## Approach Hints

<details><summary>Hint 1</summary>
`pipe` is a `reduce` over the functions: `fns.reduce((acc, fn) => fn(acc), initial)`. The only wrinkle is the first call, which should spread the original arguments.
</details>

<details><summary>Hint 2</summary>
`compose` is `pipe` with the function list reversed. `reduceRight` gives you that without copying.
</details>

<details><summary>Hint 3</summary>
Handle the zero-function case explicitly so the result is `(x) => x`, not `undefined`.
</details>

---

## Related Problems

- Implement Curry
- Implement Partial Application
