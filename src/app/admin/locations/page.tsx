import type { Metadata } from 'next';
import { AllLocationsClient } from '@/components/admin/all-locations-client';

export const metadata: Metadata = { title: 'All Locations' };

export default function AdminLocationsPage() {
  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">All Locations</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">Browse, edit, or remove any location on the platform.</p>
      <AllLocationsClient />
    </div>
  );
}
