# N66. Error boundary with context

**Difficulty:** Medium
**Topics:** Error Handling, Class Hierarchies, Serialization

---

## Description

Build an error hierarchy for CLI tools: a base `AppError` carrying a stable
`code` and arbitrary `context`, plus `toJSON()` for structured logging. Add
`ValidationError` and `NotFoundError` subclasses with preset codes.

## Examples

```ts
const err = new ValidationError('bad input', { field: 'email' });
err.code;       // 'VALIDATION'
err.toJSON();   // { name: 'ValidationError', code: 'VALIDATION', message, context }
err instanceof AppError; // true
```

## Constraints

- Fix the prototype chain so `instanceof` works after transpilation.
- `name` should reflect the concrete subclass; `toJSON` serializes name/code/message/context.
