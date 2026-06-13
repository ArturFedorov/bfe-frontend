export interface WorkspacePackage {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
}

export interface WorkspaceReport {
  // edges between workspace packages: name -> [internal dep names]
  internalGraph: Record<string, string[]>;
  // dependency on a sibling whose version does not satisfy the requested range
  mismatches: { from: string; to: string; required: string; actual: string }[];
}

/**
 * Given the packages discovered from a `workspaces` field, build the graph of
 * inter-workspace dependencies and flag version mismatches (a package depends on
 * a sibling but the sibling's actual version does not satisfy the range).
 * You may reuse a satisfies() helper.
 */
export function resolveWorkspaces(
  packages: WorkspacePackage[],
): WorkspaceReport {
  // TODO: implement
  throw new Error('Not implemented');
}
