'use client';

import { ExploreMapClient } from '@/components/map/dynamic';

export function MiniMap({
  id,
  slug,
  title,
  city,
  category,
  latitude,
  longitude,
  coverImage,
}: {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
  coverImage: string | null;
}) {
  return (
    <ExploreMapClient
      locations={[{ id, slug, title, city, category, latitude, longitude, coverImage, likesCount: 0, commentsCount: 0 }]}
      center={{ lat: latitude, lng: longitude }}
      zoom={13}
      height="320px"
      className="overflow-hidden rounded-xl2 border border-neutral-200 dark:border-neutral-700"
    />
  );
}
