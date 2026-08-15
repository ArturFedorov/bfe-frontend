# 062. Queue From Two Stacks

**Difficulty:** Medium
**Topics:** Stack, Queue, Amortized Analysis

---

## Description

Your task runner persists work as two append-only logs, the way transaction
systems replay history: you can only push onto the end of a log or pop the most
recent entry — pure LIFO. Build a FIFO task queue on top of exactly two such
stacks: `enqueue(task)` accepts new work, `dequeue()` hands back the **oldest**
pending task, `peek()` inspects it without removing, and `size()` reports the
count. The trick is the transfer: when the outbound stack runs dry, tip the
inbound stack over into it once, reversing the order — each element moves at
most twice in its lifetime, so every operation is amortized O(1).

**On your honor:** the only internal storage is two arrays used strictly as
stacks — `push` and `pop` only. No `shift`, no `unshift`, no `splice`, no
index-zero reads to fake FIFO.

## Examples

```ts
const q = new QueueFromStacks<string>();
q.enqueue('deploy');
q.enqueue('migrate');
q.peek();    // 'deploy'
q.dequeue(); // 'deploy'
q.enqueue('rollback');
q.dequeue(); // 'migrate'
q.size();    // 1
```

## Constraints

- Generic over the task type `T`.
- `dequeue()` and `peek()` on an empty queue throw an `Error`.
- `size()` is exact at all times; a fresh queue has size `0`.
- Up to `100_000` interleaved operations.

## Target

Amortized O(1) per operation; a per-dequeue O(n) rebuild will fail the large-input test.

## Interviewer follow-up

Why is dequeue amortized O(1) even though a single transfer can cost O(n)? Sketch the argument an interviewer would accept.
