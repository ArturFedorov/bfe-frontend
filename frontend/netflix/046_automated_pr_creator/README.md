# N46. Automated PR Creator

**Difficulty:** Medium
**Topics:** Automation, Codemods, Batch Processing

---

## Description

Given a list of repos and a transform, apply changes, and for each repo that
actually changed, produce a PR description (branch, changed files).

## Examples

```ts
createPullRequests(repos, 'codemod/x', transform);
// [{ repo, branch, changedFiles, description }]
```

## Constraints

- Only emit a PR when at least one file changed.
- `changedFiles` lists the paths whose contents differ after the transform.
