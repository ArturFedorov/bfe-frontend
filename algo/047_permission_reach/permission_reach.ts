export interface PermissionInput {
  /** principal id (user or group) -> ids of groups it is a member of */
  memberships: Record<string, string[]>;
  /** principal id (user or group) -> resource ids granted directly */
  grants: Record<string, string[]>;
}

export function reachableResources(
  input: PermissionInput,
  userId: string
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
