# N38. Plugin System

**Difficulty:** Medium
**Topics:** Plugins, Lifecycle Hooks, Composition

---

## Description

Define a plugin interface with `init` / `transform` / `cleanup` hooks, register
plugins, and manage execution order (transforms forward, cleanup reversed).

## Examples

```ts
host.register({ name: 'a', transform: (s) => s + '!' });
host.runTransform('hi'); // 'hi!'
```

## Constraints

- `init` and `transform` run in registration order; `cleanup` in reverse.
- Hooks are optional per plugin.
