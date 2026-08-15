# 071. Priority Job Runner

**Difficulty:** Medium
**Topics:** Concurrency Control, Priority Queues, Scheduling

---

## Description

A media pipeline runs thumbnail generation, transcoding, and subtitle jobs on
a worker with limited slots. All jobs share the pool, but a user-facing
thumbnail request must not wait behind fifty batch transcodes that happened to
arrive first. Build a `PriorityJobRunner` with a fixed concurrency limit `k`:
`run(fn, priority)` returns a promise for that job's result. Jobs start
immediately while a slot is free; once saturated they wait in a priority
queue. Whenever a slot frees up, the highest-priority waiting job starts next
— and among jobs of equal priority, arrival order (FIFO) wins.

## Examples

```ts
const runner = new PriorityJobRunner(2); // at most 2 jobs in flight

// slots free → starts immediately regardless of priority
const a = runner.run(() => transcode(fileA), 1);
const b = runner.run(() => transcode(fileB), 1);

// pool saturated → queued by priority
const c = runner.run(() => batchJob(), 1);
const d = runner.run(() => userThumbnail(), 10);
// when a slot frees, d (priority 10) starts before c (priority 1)

await Promise.all([a, b, c, d]);
```

## Constraints

- Higher numeric priority runs first; among equal priorities, strict FIFO by
  arrival order.
- At most `k` jobs are in flight at any instant — a queued job's function must
  not be invoked until a slot is free.
- A job that arrives while a slot is free starts immediately (priority only
  reorders the *waiting* queue, it never preempts running jobs).
- `run` resolves/rejects with that job's own outcome; a rejected job frees its
  slot and does not block or drop queued jobs.
- Jobs may be submitted at any time, including while others are queued — a
  later high-priority job overtakes earlier low-priority ones still waiting.

## Target

At most `k` jobs in flight at any instant; each freed slot goes to the
highest-priority (then oldest) waiting job.

## Interviewer follow-up

Low-priority jobs can starve forever under a steady stream of high-priority
work. How would you add aging (or a fairness guarantee) without breaking the
priority contract, and what does it cost per scheduling decision?
