# N27. Task Runner

**Difficulty:** Hard
**Topics:** Graphs, Topological Sort, Scheduling

---

## Description

Read tasks with dependencies, resolve a valid execution order via topological
sort, and run dependencies before dependents (parallelizing independent tasks
is a discussion extension).

## Examples

```ts
resolveOrder([{ name: 'build', deps: ['compile'] }, { name: 'compile', deps: [] }]);
// ['compile', 'build']
```

## Constraints

- Every dependency precedes the task that requires it.
- Throw on a dependency cycle.
