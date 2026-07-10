'use client';

import { useMap } from 'react-leaflet';
import { Locate, Maximize, Minimize } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function LocateControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  function handleLocate() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 13, { duration: 1 });
        setLocating(false);
      },
      () => {
        toast.error('Could not get your location. Check location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <button
      onClick={handleLocate}
      disabled={locating}
      title="Go to my location"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-soft transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <Locate className={`h-[18px] w-[18px] ${locating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

export function FullscreenControl({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [containerRef]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  }

  return (
    <button
      onClick={toggleFullscreen}
      title="Toggle fullscreen"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-soft transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {isFullscreen ? <Minimize className="h-[18px] w-[18px]" /> : <Maximize className="h-[18px] w-[18px]" />}
    </button>
  );
}
