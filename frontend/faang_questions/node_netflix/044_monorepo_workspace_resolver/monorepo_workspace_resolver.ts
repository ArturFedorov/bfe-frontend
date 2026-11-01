import { satisfies } from '../003_semver_range_matcher/semver_range_matcher';

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
  const versionMap = new Map<string, string>();
  for (const pkg of packages) {
    versionMap.set(pkg.name, pkg.version);
  }

  const internalGraph: Record<string, string[]> = {};
  const mismatches: WorkspaceReport['mismatches'] = [];

  for (const pkg of packages) {
    const internalDeps: string[] = [];

    for (const [depName, range] of Object.entries(pkg.dependencies || {})) {
      if (!versionMap.has(depName)) continue;

      internalDeps.push(depName);

      const actualVersion = versionMap.get(depName)!;

      if (!satisfies(actualVersion, range)) {
        mismatches.push({
          from: pkg.name,
          to: depName,
          required: range,
          actual: actualVersion,
        });
      }
    }

    internalGraph[pkg.name] = internalDeps;
  }

  return { internalGraph, mismatches };
}
