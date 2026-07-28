export { isDemoMode, DEMO_MEMBER_ID } from "@/lib/auth/config";
export {
  getSession,
  requireAuth,
  requireRole,
  requireRepoAccess,
  memberHasRepoAccess,
  getVisibleRepos,
  getVisibleRepoUrls,
  canAccessIntegrations,
  canManageAccess,
  hasAnyAgentsPermission,
  memberCanDelegate,
  AuthError,
} from "@/lib/auth/permissions";
export { withAuth, handleAuthError, blockHermesDelegation } from "@/lib/auth/api";
export { withRequiredAuth, catchAuthError } from "@/lib/auth/guard";
