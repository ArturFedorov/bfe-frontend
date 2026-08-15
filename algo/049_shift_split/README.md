# 049. Shift Split

**Difficulty:** Hard
**Topics:** Bipartite Check, Graph Coloring, BFS/DFS

---

## Description

You are scheduling a support team into exactly two shifts. HR gives you the employee list and a
set of conflict pairs — two people who must **not** work the same shift (incompatible, or one
reviews the other's work). Decide whether the whole team can be split into two shifts such that no
conflict pair ends up inside one shift. This is a bipartite check by 2-coloring: color each person
shift-A or shift-B while walking the conflict graph, and fail if a conflict edge ever joins two
same-colored people. The conflict graph is typically disconnected — every component must be
checked independently, and each component can choose its own coloring.

## Examples

```ts
canSplitShifts(['ana', 'bo', 'kim'], [['ana', 'bo'], ['bo', 'kim']]);
// true  — shifts: {ana, kim} and {bo}

canSplitShifts(['ana', 'bo', 'kim'], [['ana', 'bo'], ['bo', 'kim'], ['kim', 'ana']]);
// false — odd conflict triangle: someone always shares a shift with a conflict

canSplitShifts(['solo'], []);
// true
```

## Constraints

- Up to 50,000 employees and 100,000 conflict pairs; ids are unique non-empty strings.
- Conflicts are **undirected** and only reference ids present in `employees`; no self-conflicts.
- The conflict graph may be disconnected — employees with no conflicts can join either shift.
- Cycles are allowed: even cycles are splittable, odd cycles are not.
- Duplicate conflict pairs (in either order) may appear and change nothing.
- The empty employee list returns `true`.
- Shifts may be unbalanced in size — only conflict-freedom matters.

## Target

O(V + E) — one 2-coloring pass over every component.

## Interviewer follow-up

If HR then asks you to also *return* the two shifts, what do you output when a component's coloring can be flipped — and does the flip freedom matter for correctness?
