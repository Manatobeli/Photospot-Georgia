'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

function MapLoadingFallback() {
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-xl2 bg-neutral-100 dark:bg-neutral-800">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    </div>
  );
}

// Leaflet touches `window` at import time, so every map must be loaded
// client-side only — these wrappers keep that concern out of the page
// components that use them.
export const ExploreMapClient = dynamic(
  () => import('@/components/map/explore-map').then((m) => m.ExploreMap),
  { ssr: false, loading: MapLoadingFallback }
);

export const LocationPickerMapClient = dynamic(
  () => import('@/components/map/location-picker-map').then((m) => m.LocationPickerMap),
  { ssr: false, loading: MapLoadingFallback }
);
