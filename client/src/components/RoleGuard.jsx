import { useAuthStore } from '../store/authStore';

/**
 * Render children only when the current user has one of the required roles.
 * Usage:
 *   <RoleGuard roles={['ADMIN']}>
 *     <AdminOnly />
 *   </RoleGuard>
 *
 *   <RoleGuard roles={['ADMIN', 'MANAGER']} fallback={<p>Không có quyền</p>}>
 *     ...
 *   </RoleGuard>
 */
export default function RoleGuard({ roles, children, fallback = null }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) return fallback;
  return children;
}
