# 040. Accounts Merge (LeetCode 721)

**Difficulty:** Medium
**Topics:** Union-Find, Depth-First Search, Hash Table, String, Sorting

---

## Description

You are given a list of accounts. Each account is a list of strings: the first element
is a person's name, the rest are email addresses. Two accounts belong to the same person
if they share **at least one** email (directly, or transitively through other accounts).
Two accounts with the same name but no shared emails may belong to different people.
Everyone who owns an account has the same name across all their accounts.

Merge the accounts and return them in the form `[name, ...emails]`, where the emails of
each merged account are **sorted** (plain string order) and unique. The merged accounts
themselves may be returned in any order.

## Examples

```ts
accountsMerge([
  ['John', 'johnsmith@mail.com', 'john_newyork@mail.com'],
  ['John', 'johnsmith@mail.com', 'john00@mail.com'],
  ['Mary', 'mary@mail.com'],
  ['John', 'johnnybravo@mail.com'],
]);
// [
//   ['John', 'john00@mail.com', 'john_newyork@mail.com', 'johnsmith@mail.com'],
//   ['Mary', 'mary@mail.com'],
//   ['John', 'johnnybravo@mail.com'],
// ]  (outer order free)
```

## Constraints

- `1 <= accounts.length <= 1000` (tests include a larger chained input).
- `2 <= accounts[i].length <= 10`.
- Names and emails are non-empty strings of letters, digits, `_`, `.` and `@`.

## Target

O(N·α(N) + N log N) where N is the total number of emails — union-find over emails
(union each account's emails with its first email), then group by root and sort.
The large test chains thousands of accounts together; repeatedly re-scanning merged
groups (quadratic) will time out.

## Interviewer follow-up

- DFS alternative: build a graph with an edge from each account's first email to every other email in it, then each connected component is one person. Compare to union-find.
- What if emails arrive as a stream of accounts and you must answer "same person?" queries online? (Union-find wins.)
- Why must you use path compression / union by rank, and what's the complexity without them?
