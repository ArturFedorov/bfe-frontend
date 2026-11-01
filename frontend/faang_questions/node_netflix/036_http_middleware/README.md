# N36. HTTP Server with Middleware

**Difficulty:** Medium
**Topics:** Middleware, Composition, Control Flow

---

## Description

Implement Express-style `use()` + a request pipeline where each middleware calls
`next()` to continue, or stops the chain by not calling it.

## Examples

```ts
app.use((req, res, next) => { /* ... */ next(); });
app.handle(req, res);
```

## Constraints

- Run middleware in registration order.
- Not calling `next()` halts the chain.
