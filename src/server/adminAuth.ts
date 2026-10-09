/**
 * The owner has temporarily enabled direct dashboard access.
 * Keep a shared policy entry point so authentication can be restored later.
 */
export function requireAdminAccess(_request: Request) {
  return null;
}
