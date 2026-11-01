# N40. Package Publish Validator

**Difficulty:** Medium
**Topics:** Validation, Security, Publishing

---

## Description

Validate a `package.json` before publish: required fields, no `postinstall`
script, license present, and version not already taken.

## Examples

```ts
validatePublish({ name: 'p', version: '1.0.0', license: 'MIT' }, []);
// []
```

## Constraints

- Return a list of human-readable error strings (empty = valid).
- Treat a `postinstall` script as a publish blocker.
