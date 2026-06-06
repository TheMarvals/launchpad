import { hasPermission } from './permissions';

/**
 * Creates a permission checker function from a user's permission array.
 * Empty/undefined permissions = full access (backwards compat for existing admins after migration).
 */
export function createPermissionChecker(userPermissions: string[] | undefined | null) {
  const hasFullAccess = !userPermissions || userPermissions.length === 0;
  return (perm: string) => hasFullAccess || hasPermission(userPermissions, perm as any);
}
