import type { Metadata } from 'next';
import { LocationForm } from '@/components/locations/location-form';

export const metadata: Metadata = { title: 'Upload a Location' };

export default function NewLocationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Upload a Location</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Share a photography spot with the community. Submissions are reviewed by an admin before
          they go live — you can track the status from your dashboard.
        </p>
      </div>
      <LocationForm mode="create" />
    </div>
  );
}
