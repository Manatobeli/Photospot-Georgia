'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { ExploreMapClient } from '@/components/map/dynamic';
import { GeocodeSearch, type GeocodeResult } from '@/components/map/geocode-search';
import { RadiusSearchPanel } from '@/components/map/radius-search-panel';
import { CATEGORIES, GEORGIA_CITIES, CITY_COORDINATES } from '@/lib/constants';
import { DIFFICULTIES } from '@/types';
import type { FlySignal } from '@/components/map/explore-map';

interface ApiLocation {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  difficulty: string;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  likesCount: number;
  commentsCount: number;
  views: number;
  distanceKm?: number;
}

export function MapExplorer() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [distanceMode, setDistanceMode] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [items, setItems] = useState<ApiLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [flySignal, setFlySignal] = useState<FlySignal | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      if (difficulty) params.set('difficulty', difficulty);
      params.set('pageSize', '48');
      if (distanceMode && origin) {
        params.set('lat', String(origin.lat));
        params.set('lng', String(origin.lng));
        params.set('radiusKm', String(radiusKm));
      }
      const res = await fetch(`/api/locations?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [city, category, difficulty, distanceMode, origin, radiusKm]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  function handleGeocodeSelect(result: GeocodeResult) {
    setFlySignal({ lat: result.lat, lng: result.lng, zoom: 12, token: Date.now() });
    if (distanceMode) setOrigin({ lat: result.lat, lng: result.lng });
  }

  function handlePick(lat: number, lng: number) {
    if (distanceMode) setOrigin({ lat, lng });
  }

  const cityCenter = city ? CITY_COORDINATES[city as keyof typeof CITY_COORDINATES] : undefined;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`absolute z-[500] h-full w-80 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white/95 backdrop-blur-sm transition-transform dark:border-neutral-800 dark:bg-neutral-950/95 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="font-display font-semibold">Filters</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <GeocodeSearch onSelect={handleGeocodeSelect} />

          <div>
            <label className="label-base">City</label>
            <select className="input-base" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {GEORGIA_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Category</label>
            <select className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Difficulty</label>
            <div className="flex gap-1.5">
              {['', ...DIFFICULTIES].map((d) => (
                <button
                  key={d || 'any'}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                    difficulty === d
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-neutral-200 text-neutral-500 dark:border-neutral-700'
                  }`}
                >
                  {d ? d.charAt(0) + d.slice(1).toLowerCase() : 'Any'}
                </button>
              ))}
            </div>
          </div>

          <RadiusSearchPanel
            active={distanceMode}
            onToggle={() => setDistanceMode((v) => !v)}
            origin={origin}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            onClearOrigin={() => setOrigin(null)}
          />

          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-900">
            <span className="text-neutral-500 dark:text-neutral-400">Results</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : items.length}
            </span>
          </div>

          <div className="max-h-[40vh] space-y-2 overflow-y-auto">
            {items.map((loc) => (
              <Link
                key={loc.id}
                href={`/locations/${loc.slug}`}
                className="flex gap-2.5 rounded-xl border border-neutral-100 p-2 hover:border-brand-200 hover:bg-brand-50/50 dark:border-neutral-800 dark:hover:bg-brand-900/10"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {loc.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={loc.coverImage} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{loc.title}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {loc.city}
                    {loc.distanceKm !== undefined && ` · ${loc.distanceKm} km`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-4 top-4 z-[500] flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-soft lg:hidden dark:border-neutral-700 dark:bg-neutral-900"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1">
        <ExploreMapClient
          locations={items}
          center={cityCenter}
          zoom={cityCenter ? 11 : 7}
          height="100%"
          flySignal={flySignal}
          pickMode={distanceMode}
          onPick={handlePick}
          radiusSelection={distanceMode && origin ? { ...origin, radiusKm } : null}
        />
      </div>
    </div>
  );
}
