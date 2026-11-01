export interface PackageMetadata {
  daysSinceLastPublish: number;
  openIssues: number;
  weeklyDownloads: number;
  vulnerabilities: number;
}

/**
 * Compute a health score from 0..100. Start at 100 and subtract penalties:
 *   - staleness: -1 per 30 days since last publish (rounded down)
 *   - openIssues: -1 per 50 open issues
 *   - vulnerabilities: -10 each
 *   - bonus: +5 if weeklyDownloads > 100000
 * Clamp the result to [0, 100].
 */
export function scoreHealth(meta: PackageMetadata): number {
  // TODO: implement
  throw new Error('Not implemented');
}
