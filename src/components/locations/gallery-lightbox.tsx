'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface GalleryImage {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
}

export function GalleryGrid({ images, onOpen }: { images: GalleryImage[]; onOpen: (index: number) => void }) {
  if (images.length === 0) return null;
  const [cover, ...rest] = images;

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl2" style={{ height: 460 }}>
      <button
        onClick={() => onOpen(0)}
        className="relative col-span-4 row-span-2 sm:col-span-2 sm:row-span-2"
      >
        <Image src={cover.url} alt="" fill sizes="50vw" className="object-cover transition-transform duration-300 hover:scale-105" priority />
      </button>
      {rest.slice(0, 4).map((img, i) => (
        <button key={img.id} onClick={() => onOpen(i + 1)} className="relative hidden sm:block">
          <Image src={img.url} alt="" fill sizes="25vw" loading="lazy" className="object-cover transition-transform duration-300 hover:scale-105" />
          {i === 3 && rest.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
              +{rest.length - 4}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: GalleryImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const isOpen = index !== null;

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % images.length);
    setZoomed(false);
  }, [index, images.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + images.length) % images.length);
    setZoomed(false);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, goNext, goPrev, onClose]);

  // Basic touch swipe support
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goPrev();
      else goNext();
    }
    setTouchStartX(null);
  }

  return (
    <AnimatePresence>
      {isOpen && index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <button onClick={() => setZoomed((z) => !z)} className="absolute right-16 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>

          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
            {index + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={goNext} className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <motion.div
            key={images[index].id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={`relative h-[80vh] w-[92vw] sm:w-[80vw] ${zoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'}`}
            onClick={() => setZoomed((z) => !z)}
          >
            <Image
              src={images[index].url}
              alt=""
              fill
              sizes="90vw"
              className={zoomed ? 'object-contain scale-150 transition-transform' : 'object-contain transition-transform'}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
