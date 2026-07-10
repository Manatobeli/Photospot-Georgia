'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, TrendingUp, Clock, Eye, Heart, X } from 'lucide-react';
import { LocationGrid } from '@/components/locations/location-grid';
import { LocationGridSkeleton } from '@/components/ui/skeleton';
import { CATEGORIES, GEORGIA_CITIES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { LocationCardData } from '@/types';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest', icon: Clock },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'mostViewed', label: 'Most Viewed', icon: Eye },
  { value: 'mostLiked', label: 'Most Liked', icon: Heart },
];

export function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true');

  const [items, setItems] = useState<LocationCardData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildParams = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      if (featured) params.set('featured', 'true');
      params.set('sort', sort === 'trending' ? 'mostViewed' : sort);
      params.set('page', String(targetPage));
      params.set('pageSize', '16');
      return params;
    },
    [q, city, category, sort, featured]
  );

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?${buildParams(targetPage).toString()}`, { cache: 'no-store' });
        const data = await res.json();
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setTotal(data.total);
        setPage(targetPage);
      } finally {
        setLoading(false);
      }
    },
    [buildParams]
  );

  // Re-run search when filters change; sync URL for shareable/bookmarkable searches.
  useEffect(() => {
    const params = buildParams(1);
    router.replace(`/search?${params.toString()}`, { scroll: false });
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, category, sort, featured]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          load(page + 1, false);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, load]);

  const activeFilterCount = [city, category, featured].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Search Locations</h1>

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, description, city, tag, or category…"
            className="input-base pl-11 py-3 text-base"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select className="input-base w-auto" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {GEORGIA_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input-base w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => setFeatured((v) => !v)}
            className={cn('rounded-full border px-3.5 py-2 text-sm font-medium', featured ? 'border-brand-500 bg-brand-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300')}
          >
            Featured only
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setCity('');
                setCategory('');
                setFeatured(false);
              }}
              className="text-sm font-medium text-neutral-500 hover:text-red-600"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                sort === opt.value
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
              )}
            >
              <opt.icon className="h-3.5 w-3.5" /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        {loading && items.length === 0 ? 'Searching…' : `${total} location${total === 1 ? '' : 's'} found`}
      </p>

      <div className="mt-4">
        {items.length === 0 && !loading ? (
          <LocationGrid items={[]} emptyTitle="No locations match your search" emptyDescription="Try a different keyword, or clear your filters." />
        ) : (
          <LocationGrid items={items} />
        )}
        {loading && items.length === 0 && <LocationGridSkeleton />}
        <div ref={sentinelRef} className="h-4" />
        {loading && items.length > 0 && <LocationGridSkeleton count={4} />}
      </div>
    </div>
  );
}
