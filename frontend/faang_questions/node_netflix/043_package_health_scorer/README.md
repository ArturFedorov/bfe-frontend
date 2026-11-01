# N43. Package Health Scorer

**Difficulty:** Easy
**Topics:** Scoring, Heuristics

---

## Description

Compute a 0–100 health score for a package from its metadata (recency, open
issues, downloads, vulnerabilities).

## Examples

```ts
scoreHealth({ daysSinceLastPublish: 0, openIssues: 0, weeklyDownloads: 0, vulnerabilities: 3 });
// 70
```

## Constraints

- Start at 100, subtract the documented penalties, add the downloads bonus.
- Clamp to `[0, 100]`.
