# 8. Implement Function.prototype.bind

**Difficulty:** Medium

**Topics:** Functions, this Context, Partial Application, Closures

---

## Description

Implement your own version of `Function.prototype.bind`. The function should return a new function that, when called, has its `this` keyword set to the provided value, with a given sequence of arguments prepended to any arguments provided when the new function is called.

Your `myBind` function should:
1. Bind the `this` context to `thisArg`
2. Support partial application (pre-filling arguments)
3. Combine bound arguments with call-time arguments

```typescript
function myBind(fn: Function, thisArg: any, ...boundArgs: any[]): (...args: any[]) => any
```

---

## Examples

### Example 1
```typescript
const obj = { x: 42 };
function getX() { return this.x; }
const bound = myBind(getX, obj);
bound(); // => 42
```

### Example 2
```typescript
function add(a, b) { return a + b; }
const add5 = myBind(add, null, 5);
add5(3); // => 8
```

---

## Constraints

- Must correctly bind the `this` context
- Must support partial application
- Bound args come before call-time args
- Should work with `null` as `thisArg`
- Should support chained binds

---

## Approach Hints

<details><summary>Hint 1</summary>
Return a new function that uses `fn.apply(thisArg, ...)` to invoke the original function with the correct context.
</details>

<details><summary>Hint 2</summary>
Concatenate `boundArgs` with the arguments passed to the returned function.
</details>

<details><summary>Hint 3</summary>
Use the spread operator or `Array.prototype.concat` to merge the bound arguments with call-time arguments.
</details>
