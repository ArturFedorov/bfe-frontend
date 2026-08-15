# 073. Dependency Task Runner

**Difficulty:** Hard
**Topics:** Dependency Graphs, Concurrency Control, Topological Scheduling

---

## Description

A deploy system runs tasks like `build`, `test`, `migrate-db`, and `release`,
where each task declares which task ids it depends on. Build
`runTaskGraph(tasks, concurrency)`: it executes the whole graph with at most
`concurrency` tasks in flight, and each task starts *the moment* all of its
dependencies have fulfilled (and a slot is free) — not in rigid levels or
batches. If a task fails, every task that depends on it (directly or
transitively) is skipped without running, while independent branches keep
going. The runner resolves with a per-task status map and validates the graph
up front: a dependency cycle (or a reference to an unknown id) throws before
any task runs.

## Examples

```ts
const statuses = await runTaskGraph(
  [
    { id: 'build', deps: [], run: () => compile() },
    { id: 'test', deps: ['build'], run: () => runTests() },
    { id: 'docs', deps: ['build'], run: () => buildDocs() },
    { id: 'release', deps: ['test', 'docs'], run: () => publish() },
  ],
  2
);
// { build: 'fulfilled', test: 'fulfilled', docs: 'fulfilled', release: 'fulfilled' }

// if runTests() rejects:
// { build: 'fulfilled', test: 'rejected', docs: 'fulfilled', release: 'skipped' }

runTaskGraph([{ id: 'a', deps: ['a'], run: async () => {} }], 1); // throws (cycle)
```

## Constraints

- At most `concurrency` tasks are in flight at any instant.
- A task starts as soon as *all* its dependencies have fulfilled and a slot is
  free — a slow sibling branch must not delay it (no level-by-level execution).
- Each task runs at most once, even when it is a shared dependency of many
  tasks (diamond shapes).
- On failure: the failing task's status is `'rejected'`; every direct or
  transitive dependent is `'skipped'` and its `run` is never invoked;
  unrelated tasks still run to completion.
- The returned promise *resolves* with a status
  (`'fulfilled' | 'rejected' | 'skipped'`) for every task id — task failures
  never reject the runner itself.
- Cycles and unknown dependency ids are detected up front: `runTaskGraph`
  throws synchronously and no task's `run` is invoked.

## Target

Each task starts the moment its dependencies finish, with at most
`concurrency` tasks in flight at any instant.

## Interviewer follow-up

Suppose one task is a known bottleneck that everything downstream waits on.
How would you extend the runner with per-task priorities or critical-path
scheduling so the longest dependency chain finishes first — and when a slot
frees, which ready task should get it?
