import type { Metadata } from 'next';
import { PendingReviewClient } from '@/components/admin/pending-review-client';

export const metadata: Metadata = { title: 'Pending Review' };

export default function AdminPendingPage() {
  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Pending Review</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        Approve, reject, or request changes on newly submitted locations.
      </p>
      <PendingReviewClient />
    </div>
  );
}
