# N65. Fluent API builder

**Difficulty:** Medium
**Topics:** API Design, Method Chaining

---

## Description

Design and implement a chainable query builder. Each method returns the builder
so calls chain, and `build()` produces a SQL-ish string. Support `select`,
`from`, `where`, and `orderBy`.

## Examples

```ts
new QueryBuilder()
  .select('id', 'name')
  .from('users')
  .where('age > 18')
  .orderBy('name', 'ASC')
  .build();
// "SELECT id, name FROM users WHERE age > 18 ORDER BY name ASC"
```

## Constraints

- Methods return `this` for chaining.
- `orderBy` direction defaults to `ASC`.
