# N32. Schema Validator

**Difficulty:** Medium
**Topics:** Validation, Recursion, Trees

---

## Description

Validate a config object against a JSON-schema-like spec, returning typed errors
with the path to each offending value.

## Examples

```ts
validate({ age: 'x' }, { type: 'object', properties: { age: { type: 'number' } } });
// [{ path: 'age', message: 'expected number' }]
```

## Constraints

- Support `string`/`number`/`boolean`, nested `object` (+ `required`), and `array`.
- Paths use dotted keys and `[i]` for array indices.
