export interface Repo {
  name: string;
  files: Record<string, string>; // path -> contents
}

export type Transform = (files: Record<string, string>) => Record<string, string>;

export interface PullRequest {
  repo: string;
  branch: string;
  changedFiles: string[];
  description: string;
}

/**
 * For each repo, apply the transform to its files. If anything changed, produce
 * a PullRequest describing the change (branch name, changed file paths, and a
 * description). Repos with no changes produce no PR.
 */
export function createPullRequests(
  repos: Repo[],
  branch: string,
  transform: Transform,
): PullRequest[] {
  // TODO: implement
  throw new Error('Not implemented');
}
