# 047. Permission Reach

**Difficulty:** Medium
**Topics:** Graph Traversal, Multi-Source BFS/DFS, Cycle Safety

---

## Description

Your access-control system grants resources to principals (users or groups), and groups can be
members of other groups, nesting arbitrarily deep. A user can reach a resource if it is granted to
the user directly, or to **any** group reachable from the user through a chain of memberships.
Given the membership map (principal id → groups it belongs to) and the grants map (principal id →
resource ids granted directly), return every resource id the user can reach, sorted
alphabetically. Real directory data is messy: group membership chains can contain cycles (A in B,
B in A), and the traversal must handle them without looping. Note the user may start in several
groups at once — this is a traversal from multiple frontier nodes.

## Examples

```ts
const input = {
  memberships: {
    alice: ['devs', 'oncall'],
    devs: ['engineering'],
    oncall: [],
    engineering: [],
  },
  grants: {
    alice: ['laptop'],
    devs: ['repo'],
    engineering: ['vpn', 'wiki'],
    oncall: ['pager'],
  },
};
reachableResources(input, 'alice'); // ['laptop', 'pager', 'repo', 'vpn', 'wiki']
reachableResources(input, 'devs');  // ['repo', 'vpn', 'wiki']
reachableResources({ memberships: {}, grants: {} }, 'ghost'); // []
```

## Constraints

- Up to 100,000 principals and 500,000 membership edges; ids are non-empty strings.
- Membership edges are **directed**: member → group (grants flow back down to the member).
- Membership cycles are allowed and must not cause infinite loops.
- Principals missing from `memberships` or `grants` are treated as having none.
- Duplicate resource grants across groups appear **once** in the output.
- An unknown user id returns `[]`; output is always sorted alphabetically.

## Target

O(V + E + R log R) — one traversal plus sorting the R reachable resources.

## Interviewer follow-up

If the product also needs the reverse query — "which users can reach resource X?" — would you answer it with this same graph, and at what cost?
