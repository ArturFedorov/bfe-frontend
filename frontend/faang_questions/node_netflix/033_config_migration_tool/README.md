# N33. Config Migration Tool

**Difficulty:** Medium
**Topics:** Transforms, Migrations, Dry-run

---

## Description

Migrate config files from an old format to a new one via ordered key renames /
value transforms, with a dry-run mode that reports changes without applying them.

## Examples

```ts
migrateConfig({ oldName: 'x' }, [{ from: 'oldName', to: 'newName' }]);
// { config: { newName: 'x' }, changes: ['renamed oldName -> newName'] }
```

## Constraints

- Apply migrations in order.
- `dryRun` returns the original config but still computes the change log.
