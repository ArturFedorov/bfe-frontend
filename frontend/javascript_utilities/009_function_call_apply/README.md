# 9. Implement Function.prototype.call and apply

**Difficulty:** Medium

**Topics:** Functions, this Context, Arguments Handling

---

## Description

Implement your own versions of `Function.prototype.call` and `Function.prototype.apply`.

- `myCall` invokes the function with a given `this` value and arguments provided individually.
- `myApply` invokes the function with a given `this` value and arguments provided as an array.

```typescript
function myCall(fn: Function, thisArg: any, ...args: any[]): any
function myApply(fn: Function, thisArg: any, args?: any[]): any
```

---

## Examples

### Example 1
```typescript
const obj = { x: 10 };
function getX() { return this.x; }
myCall(getX, obj); // => 10
myApply(getX, obj); // => 10
```

### Example 2
```typescript
function add(a, b) { return a + b; }
myCall(add, null, 3, 4); // => 7
myApply(add, null, [3, 4]); // => 7
```

---

## Constraints

- Must correctly set the `this` context
- `myCall` accepts arguments individually
- `myApply` accepts arguments as an array (or undefined)
- Should handle `null` or `undefined` as `thisArg`
- Must not permanently modify the `thisArg` object

---

## Approach Hints

<details><summary>Hint 1</summary>
Temporarily attach the function as a property of `thisArg`, invoke it, then delete the property.
</details>

<details><summary>Hint 2</summary>
Use a `Symbol()` as the temporary property key to avoid collisions with existing properties.
</details>

<details><summary>Hint 3</summary>
Handle the case where `thisArg` is `null` or `undefined` — in non-strict mode this defaults to the global object.
</details>
