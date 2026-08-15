# 020. Archive Completed

**Difficulty:** Medium
**Topics:** Two Pointers, In-Place Mutation, Stable Partition

---

## Description

A task manager renders active tasks at the top of the list and archives completed ones at the
bottom. After a bulk status sync, completed tasks are scattered throughout the array. Rearrange the
array **in place** so that all active tasks come first — preserving their original relative order —
followed by all completed tasks. The relative order of the completed tasks does not matter. The
list can be large and the sync runs on every keystroke, so no temporary arrays: use a write pointer
for the next active slot while a read pointer scans ahead.

## Examples

```ts
const tasks = [
  { id: 1, title: 'ship', completed: true },
  { id: 2, title: 'review', completed: false },
  { id: 3, title: 'deploy', completed: true },
  { id: 4, title: 'test', completed: false },
];
archiveCompleted(tasks);
// tasks is now: id 2, id 4 (active, original order), then ids 1 and 3 in any order

const empty: Task[] = [];
archiveCompleted(empty); // stays []
```

## Constraints

- `tasks.length` is between `0` and `200_000`.
- Mutate the given array in place; do not allocate a new array (O(1) extra space).
- Active tasks (`completed === false`) must keep their original relative order.
- Completed tasks may end up in any order after the active block.
- The function returns nothing — the mutation is the result.
- Works when all tasks are active, all are completed, or the array is empty.

## Target

O(n) time, O(1) extra space.

## Interviewer follow-up

The product team now wants completed tasks to also keep their original relative order (a fully
stable partition). Can you still do it in O(n) time and O(1) space, and if not, what trade-off
would you offer?
