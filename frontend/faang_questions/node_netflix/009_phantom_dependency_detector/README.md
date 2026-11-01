# N9. Phantom Dependency Detector

**Difficulty:** Medium
**Topics:** Parsing, Regex, Dependency Hygiene

---

## Description

Scan source code for `import`/`require` of bare package specifiers and flag any
that are used but not declared in `package.json`. Ignore relative imports.

## Examples

```ts
findPhantomDeps(`const x = require('lodash');`, ['express']);
// ['lodash']
```

## Constraints

- Ignore relative/absolute paths (`./`, `../`, `/`).
- For scoped packages (`@scope/name`), the package name is `@scope/name`.
- Return a de-duplicated, sorted list.
