import type { Metadata } from 'next';
import { ReportsClient } from '@/components/admin/reports-client';

export const metadata: Metadata = { title: 'Reports' };

export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Reports</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">Review content flagged by the community.</p>
      <ReportsClient />
    </div>
  );
}
