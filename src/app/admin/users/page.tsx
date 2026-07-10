import type { Metadata } from 'next';
import { UsersManagementClient } from '@/components/admin/users-management-client';

export const metadata: Metadata = { title: 'Manage Users' };

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Users</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">Manage roles, ban abusive accounts, or remove users.</p>
      <UsersManagementClient />
    </div>
  );
}
