# N57. Test harness

**Difficulty:** Medium
**Topics:** Testing, Closures, Registries

---

## Description

Implement a minimal test harness: `describe`, `it`, `expect` (with `toBe` and
`toEqual` matchers), and `run`. A failing assertion should be recorded as a
failed result rather than aborting the whole run.

## Examples

```ts
describe('math', () => {
  it('adds', () => expect(1 + 1).toBe(2));
});
const results = run(); // [{ name, passed, error? }, ...]
```

## Constraints

- `run` returns every test's result; one failure must not stop other tests.
- `toEqual` does a deep equality check; `toBe` is strict (`===`).
