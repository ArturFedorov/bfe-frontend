# 068. Serial Async Queue

**Difficulty:** Medium
**Topics:** Promises, Scheduling, Concurrency Control

---

## Description

Writes to a local config file must never interleave: if two saves run at once
the file is corrupted. Build an `AsyncQueue` class whose `enqueue(fn)` accepts
an async task, returns a promise for that specific task's result, and
guarantees tasks run strictly one at a time in arrival order. A task that
rejects must reject its own caller's promise — and nothing else: the queue
moves on to the next task as if nothing happened. Callers may enqueue new
tasks at any time, including from inside a running task's continuation.

## Examples

```ts
const queue = new AsyncQueue();

const a = queue.enqueue(() => writeConfig({ theme: 'dark' }));
const b = queue.enqueue(() => writeConfig({ theme: 'light' }));
// second write starts only after the first fully settles
await b;

// a failing task rejects only its own promise
const bad = queue.enqueue(() => Promise.reject(new Error('disk full')));
const ok = queue.enqueue(() => Promise.resolve('saved'));
await bad.catch(() => {});
await ok; // 'saved' — the queue kept going
```

## Constraints

- Strict FIFO: tasks start in the exact order they were enqueued.
- At most one task is executing at any instant — a task's function is not
  invoked until the previous task's promise has settled.
- `enqueue` returns a promise that settles with that task's own outcome
  (value or rejection reason), never another task's.
- A rejected task does not stop, skip, or reorder the rest of the queue.
- The queue is re-entrant: enqueuing while a task runs (or from a `.then` of a
  previous task) appends normally.
- An empty queue starts the next enqueued task immediately (no dead state
  after draining).

## Target

At most one task in flight at any instant, started in exact arrival order.

## Interviewer follow-up

Your queue serializes everything globally. How would you extend it to
serialize per key (e.g. one queue per file path) while letting different keys
run in parallel — and what cleanup problem does that introduce?
