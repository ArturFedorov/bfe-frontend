# N45. Migration Script Runner

**Difficulty:** Medium
**Topics:** Migrations, Idempotency, Ordering

---

## Description

Run migrations in order, tracking which have already run so re-invocation is
idempotent. (Rollback and progress tracking are natural extensions.)

## Examples

```ts
runMigrations(migrations, ['001']); // runs everything except 001
```

## Constraints

- Run in ascending `id` order.
- Skip ids present in `alreadyRun`; report applied vs skipped.
