# N21. Import Sorter

**Difficulty:** Medium
**Topics:** Parsing, Sorting

---

## Description

Sort imports into Node builtins → external → internal groups, alphabetized within
each group and separated by blank lines.

## Examples

```ts
sortImports(["import b from 'b';", "import fs from 'fs';"]);
// ["import fs from 'fs';", '', "import b from 'b';"]
```

## Constraints

- Builtins: a known set (`fs`, `path`, `http`, ...) plus any `node:` prefix.
- Internal: specifiers starting with `.` or `/`.
- Separate non-empty groups with a single blank-line entry (`''`).
