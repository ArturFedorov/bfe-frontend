# 17. Implement Memoize

**Difficulty:** Medium

**Topics:** JavaScript Utilities, Closures, Caching

---

## Description

Implement a `memoize` function that caches the result of a function based on its arguments. An optional `keyFn` can be provided to customize how the cache key is generated.

```typescript
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T
```

---

## Examples

### Example 1
```typescript
const double = memoize((x: number) => x * 2);
double(5); // 10 (computed)
double(5); // 10 (cached)
```

### Example 2
```typescript
const getUser = memoize(
  (user: { id: number }) => fetchUser(user.id),
  (user) => String(user.id)
);
```

---

## Constraints

- Without `keyFn`, use `JSON.stringify` of the arguments as the default key
- The memoized function should behave identically to the original
- Cache should persist across calls

---

## Approach Hints

<details><summary>Hint 1</summary>
Use a `Map` or plain object to store cached results.
</details>

<details><summary>Hint 2</summary>
If no `keyFn` is provided, `JSON.stringify(args)` is a reasonable default key.
</details>

---

## Related Problems

- Implement Once
- Implement LRU Cache
