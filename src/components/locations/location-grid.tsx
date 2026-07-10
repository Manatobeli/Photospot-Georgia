'use client';

import { LocationCard } from '@/components/locations/location-card';
import { EmptyState } from '@/components/ui/empty-state';
import { MapPinOff } from 'lucide-react';
import type { LocationCardData } from '@/types';

export function LocationGrid({
  items,
  emptyTitle = 'No locations found',
  emptyDescription = 'Try adjusting your filters or check back soon.',
}: {
  items: (LocationCardData & { distanceKm?: number })[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState icon={MapPinOff} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((loc, i) => (
        <LocationCard key={loc.id} location={loc} distanceKm={loc.distanceKm} priority={i < 4} />
      ))}
    </div>
  );
}
