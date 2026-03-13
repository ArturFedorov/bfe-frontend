# 25. Implement Object.keys, Object.values, Object.entries

**Difficulty:** Easy

**Topics:** JavaScript Utilities, Objects, Enumeration

---

## Description

Implement your own versions of `Object.keys()`, `Object.values()`, and `Object.entries()`.

- `objectKeys(obj)` — returns an array of the object's own enumerable string-keyed property names.
- `objectValues(obj)` — returns an array of the object's own enumerable string-keyed property values.
- `objectEntries(obj)` — returns an array of the object's own enumerable string-keyed `[key, value]` pairs.

```typescript
function objectKeys(obj: object): string[]
function objectValues(obj: object): any[]
function objectEntries(obj: object): [string, any][]
```

---

## Examples

### Example 1
```typescript
objectKeys({ a: 1, b: 2 }); // ["a", "b"]
objectValues({ a: 1, b: 2 }); // [1, 2]
objectEntries({ a: 1, b: 2 }); // [["a", 1], ["b", 2]]
```

### Example 2
```typescript
objectKeys({}); // []
objectValues({}); // []
objectEntries({}); // []
```

### Example 3
```typescript
const obj = { 1: "a", 2: "b" };
objectKeys(obj); // ["1", "2"]
```

---

## Constraints

- Only own enumerable properties should be included
- Symbol keys should be excluded
- Numeric keys should be returned as strings
- Inherited properties (from the prototype chain) should not be included

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a `for...in` loop combined with `hasOwnProperty` to iterate only own properties.
</details>

<details><summary>Hint 2</summary>
Remember that `for...in` also iterates inherited properties — you must filter them out.
</details>

<details><summary>Hint 3</summary>
`typeof` on a property key from `for...in` is always `"string"`, so symbols are already excluded.
</details>
