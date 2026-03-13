# 24. Implement Object.create

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Prototypal Inheritance

---

## Description

Implement an `objectCreate` function that creates a new object with the specified prototype and optional property descriptors, similar to `Object.create`.

```typescript
function objectCreate(proto: object | null, properties?: PropertyDescriptorMap): any
```

---

## Examples

### Example 1
```typescript
const proto = { greet() { return "hello"; } };
const obj = objectCreate(proto);
obj.greet(); // "hello"
```

### Example 2
```typescript
const obj = objectCreate(null);
Object.getPrototypeOf(obj); // null
```

---

## Constraints

- The created object's prototype should be set to `proto`
- If `proto` is `null`, the object has no prototype
- If `properties` is provided, define them on the new object using `Object.defineProperties`
- The new object should not have own properties from the prototype

---

## Approach Hints

<details><summary>Hint 1</summary>
Create a temporary constructor function and set its prototype.
</details>

<details><summary>Hint 2</summary>
Use `new` with the temporary constructor to create the object.
</details>

<details><summary>Hint 3</summary>
If properties are provided, use `Object.defineProperties` to apply them.
</details>

---

## Related Problems

- Implement Object.assign
- Implement Function.prototype.bind
