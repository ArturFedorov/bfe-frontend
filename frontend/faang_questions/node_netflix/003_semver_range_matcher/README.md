# N3. Semver Range Matcher

**Difficulty:** Medium
**Topics:** Semver, Ranges, Parsing

---

## Description

Implement `satisfies(version, range)` supporting `^`, `~`, `>=`, `>`, `<=`, `<`,
exact versions, and `||` unions.

## Examples

```ts
satisfies('1.5.0', '^1.2.3');            // true
satisfies('1.3.0', '~1.2.3');            // false
satisfies('2.5.0', '^1.0.0 || ^2.0.0');  // true
```

## Constraints

- `^1.2.3` allows `>=1.2.3 <2.0.0` (caret pins the left-most non-zero).
- `~1.2.3` allows `>=1.2.3 <1.3.0`.
- A range may be a `||`-separated union; match if any clause matches.
