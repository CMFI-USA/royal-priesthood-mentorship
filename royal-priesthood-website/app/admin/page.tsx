import { cookies } from 'next/headers';

import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { ADMIN_SESSION_COOKIE, isAdminSessionValueValid } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const sessionValue = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = isAdminSessionValueValid(sessionValue);

  return isAuthenticated ? <AdminDashboard /> : <AdminLoginForm />;
}
