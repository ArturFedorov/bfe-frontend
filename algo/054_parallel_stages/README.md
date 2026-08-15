# 054. Parallel Build Stages

**Difficulty:** Medium
**Topics:** Topological Sort, BFS Levels, Scheduling

---

## Description

Your CI system has unlimited workers, so instead of one flat build order it wants
**stages**: groups of build targets that can all build concurrently. A target belongs
to the earliest stage in which every one of its dependencies has already finished —
targets with no dependencies form stage 0, targets that only depend on stage 0 form
stage 1, and so on (level-based Kahn). Return the stages in execution order; within
each stage, sort target names alphabetically so the plan is deterministic and
diffable in CI logs. A dependency cycle makes staging impossible — throw.

## Examples

```ts
const manifest = {
  app: ['lib', 'assets'],
  lib: ['utils'],
  assets: ['utils'],
  utils: [],
};

parallelStages(manifest);
// [['utils'], ['assets', 'lib'], ['app']]

parallelStages({ a: [], b: [], c: ['a'] });
// [['a', 'b'], ['c']]

parallelStages({ a: ['b'], b: ['a'] }); // throws (cycle)
```

## Constraints

- Input is `Record<string, string[]>`: each key depends on every id in its array; every id that appears in an array is also a key.
- Cycles are possible — **throw an `Error`** when one exists.
- Every target appears in exactly one stage; a target's stage index is strictly greater than the stage index of each of its dependencies (specifically, 1 + the max of them).
- Each inner array is sorted alphabetically (`Array.prototype.sort` default order) — the full output is therefore unique and deterministic.
- An empty graph returns `[]`. Do not mutate the input graph.

## Target

O(V + E) time plus O(V log V) for the per-stage sorts.

## Interviewer follow-up

If workers were limited to k per stage, how would you split stages — and why can greedily filling stages break the "as early as possible" property?
