# N15. Implement `require()`

**Difficulty:** Hard
**Topics:** Module Resolution, Node Internals, Caching

---

## Description

Implement the CommonJS module resolution algorithm against an in-memory
filesystem: extension resolution, `index.js` directory fallback, JSON loading,
and a require cache.

## Examples

```ts
const req = createRequire({ '/a.js': "module.exports = 1;" });
req('/a.js'); // 1
```

## Constraints

- Support `.js` and `.json`, plus directory `index.js` fallback.
- Cache by resolved path so a module executes once.
- Each `.js` module gets `module`, `exports`, and `require` in scope.
