/**
 * Parse conventional-commit subjects and generate a markdown changelog grouped
 * by type. Recognize `feat`, `fix`, and `chore` (others -> 'Other').
 * Output sections in the order: Features, Bug Fixes, Chores, Other — omitting
 * empty sections.
 *
 * Commit format: `type(scope?): description`
 */
export function generateChangelog(commits: string[]): string {
  // TODO: implement
  throw new Error('Not implemented');
}
