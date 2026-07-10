'use client';

import { useState } from 'react';
import { GalleryGrid, Lightbox, type GalleryImage } from '@/components/locations/gallery-lightbox';

export function GalleryWithLightbox({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <GalleryGrid images={images} onOpen={setIndex} />
      <Lightbox images={images} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </>
  );
}
