'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
}

/**
 * Free-text location search backed by the OpenStreetMap Nominatim API,
 * scoped to Georgia. This call is made from the browser, so it works
 * wherever the app is actually deployed/run — it does not depend on the
 * build/dev environment having outbound network access.
 */
export function GeocodeSearch({
  onSelect,
  placeholder = 'Search for a place in Georgia…',
  className = '',
}: {
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', value);
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('countrycodes', 'ge');
        url.searchParams.set('limit', '6');
        const res = await fetch(url.toString(), {
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();
        setResults(
          data.map((d: any) => ({ displayName: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }))
        );
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input-base pl-10"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-[1000] mt-1.5 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card-hover dark:border-neutral-800 dark:bg-neutral-900">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQuery(r.displayName);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span className="line-clamp-2 text-neutral-700 dark:text-neutral-200">{r.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
