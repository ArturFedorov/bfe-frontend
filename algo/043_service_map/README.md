# 043. Service Map

**Difficulty:** Very Easy
**Topics:** Graphs, Adjacency List, Hash Maps

---

## Description

Your observability platform receives a flat list of microservice calls, each one recording that
service `from` invoked service `to`. Before any traversal or analysis can happen, this raw call
log has to become a graph. Build a directed adjacency list from the calls and report the in-degree
(how many distinct services call it) and out-degree (how many distinct services it calls) of every
service. A service that appears only as a call target must still show up in every map — with an
empty adjacency list and an out-degree of 0. Repeated calls between the same pair of services
represent a single dependency edge and must be deduplicated.

## Examples

```ts
buildServiceMap([
  { from: 'web', to: 'auth' },
  { from: 'web', to: 'billing' },
  { from: 'billing', to: 'auth' },
]);
// {
//   adjacency: { web: ['auth', 'billing'], billing: ['auth'], auth: [] },
//   inDegree:  { web: 0, auth: 2, billing: 1 },
//   outDegree: { web: 2, auth: 0, billing: 1 },
// }

buildServiceMap([
  { from: 'a', to: 'b' },
  { from: 'a', to: 'b' }, // duplicate call — one edge
]);
// { adjacency: { a: ['b'], b: [] }, inDegree: { a: 0, b: 1 }, outDegree: { a: 1, b: 0 } }

buildServiceMap([]); // { adjacency: {}, inDegree: {}, outDegree: {} }
```

## Constraints

- Up to 100,000 calls; service ids are non-empty strings.
- The graph is **directed**: `from → to`.
- Duplicate `from → to` pairs count as one edge everywhere (adjacency and both degrees).
- Self-calls (`from === to`) are valid: one edge that adds 1 to both the in- and out-degree of the service.
- Disconnected services and cycles are allowed; the empty call list yields three empty records.
- Neighbor lists preserve first-seen call order.

## Target

O(C) over the number of calls, with O(1) expected-time edge dedup.

## Interviewer follow-up

If the call log had 10 million entries but only ~200 distinct services, what dominates your memory usage, and would you change the representation?
