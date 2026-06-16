# N2. Semver Comparator

**Difficulty:** Easy
**Topics:** Parsing, Comparison, Semver

---

## Description

Implement `compare(a, b)` returning `-1 / 0 / 1`, plus the helpers `gt()`, `lt()`,
and `eq()`. Compare major, then minor, then patch numerically.

## Examples

```ts
compare('2.0.0', '1.9.9'); // 1
compare('1.1.1', '1.1.2'); // -1
gt('1.2.4', '1.2.3');      // true
```

## Constraints

- Inputs are valid `major.minor.patch` strings (handling prerelease is a bonus).
- Compare numerically, not lexically (`10 > 9`).
