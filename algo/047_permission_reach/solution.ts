/**
 * Permission Reach — reference solution.
 *
 * BFS over the directed membership graph (member → group) starting at the
 * user. Every principal reached — the user itself plus every group it is
 * transitively a member of — contributes its direct grants to a Set, which
 * both deduplicates resources granted via several paths and makes the final
 * sort cheap. A visited set makes membership cycles and self-loops harmless.
 * The traversal is iterative (index-based queue), so a 50k-deep membership
 * chain cannot overflow the call stack.
 *
 * Time:  O(V + E + R log R) — one traversal plus sorting R resources.
 * Space: O(V + R).
 */

export interface PermissionInput {
  /** principal id (user or group) -> ids of groups it is a member of */
  memberships: Record<string, string[]>;
  /** principal id (user or group) -> resource ids granted directly */
  grants: Record<string, string[]>;
}

export function reachableResources(
  input: PermissionInput,
  userId: string,
): string[] {
  const { memberships, grants } = input;

  const visited = new Set<string>([userId]);
  const queue: string[] = [userId];
  const resources = new Set<string>();

  for (let i = 0; i < queue.length; i++) {
    const principal = queue[i];

    // Grants attached directly to this principal (missing => none).
    for (const resource of grants[principal] ?? []) {
      resources.add(resource);
    }

    // Follow membership edges to the groups this principal belongs to.
    for (const group of memberships[principal] ?? []) {
      if (!visited.has(group)) {
        visited.add(group);
        queue.push(group);
      }
    }
  }

  // Plain code-unit order; an unknown user simply yields an empty set.
  return [...resources].sort();
}
