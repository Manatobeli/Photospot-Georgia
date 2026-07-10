import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchPageClient } from './search-page-client';
import { LocationGridSkeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Search Locations' };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8"><LocationGridSkeleton /></div>}>
      <SearchPageClient />
    </Suspense>
  );
}
