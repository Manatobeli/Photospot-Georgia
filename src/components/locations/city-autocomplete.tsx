'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, MapPin } from 'lucide-react';

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'e.g. Tbilisi, Nokalakevi…',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  function handleChange(next: string) {
    onChange(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', next);
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('countrycodes', 'ge');
        url.searchParams.set('featureType', 'settlement');
        url.searchParams.set('namedetails', '1');
        url.searchParams.set('limit', '8');
        const res = await fetch(url.toString(), { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        const names: string[] = (data as any[])
          .map((d) => d.namedetails?.name || d.display_name.split(',')[0])
          .filter((name: string, i: number, arr: string[]) => name && arr.indexOf(name) === i);
        setSuggestions(names);
        setOpen(names.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          className="input-base"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          required
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[1000] mt-1.5 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card-hover dark:border-neutral-800 dark:bg-neutral-900">
          {suggestions.map((name, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onChange(name);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="text-neutral-700 dark:text-neutral-200">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}