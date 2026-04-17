import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated();

  return isAuthenticated ? <AdminDashboard /> : <AdminLoginForm />;
}
