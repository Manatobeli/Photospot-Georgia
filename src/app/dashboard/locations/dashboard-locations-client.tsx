'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2, Edit3, Eye, MessageCircle, Heart } from 'lucide-react';
import { StatusBadge, DifficultyBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LocationGridSkeleton } from '@/components/ui/skeleton';
import { MapPinOff } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/cn';

const TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CHANGES_REQUESTED', label: 'Changes Requested' },
  { value: 'REJECTED', label: 'Rejected' },
];

interface DashLocation {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  status: string;
  difficulty: string;
  coverImage: string | null;
  likesCount: number;
  commentsCount: number;
  views: number;
  createdAt: string;
}

export function DashboardLocationsClient() {
  const { user } = useAuth();
  const [tab, setTab] = useState('');
  const [items, setItems] = useState<DashLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams({ author: user.username, pageSize: '48' });
    if (tab) params.set('status', tab);
    fetch(`/api/locations?${params.toString()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [tab, user]);

  async function handleDelete(slug: string) {
    if (!confirm('Delete this location permanently? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/locations/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.filter((i) => i.slug !== slug));
      toast.success('Location deleted');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete');
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">My Locations</h1>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium',
              tab === t.value
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LocationGridSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MapPinOff}
          title="No locations here"
          description="Try a different tab or upload a new location."
          actionLabel="Upload a Location"
          actionHref="/locations/new"
        />
      ) : (
        <div className="space-y-3">
          {items.map((loc) => (
            <div key={loc.id} className="card-base flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 sm:w-32">
                {loc.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={loc.coverImage} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/locations/${loc.slug}`} className="truncate font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400">
                    {loc.title}
                  </Link>
                  <StatusBadge status={loc.status} />
                  <DifficultyBadge difficulty={loc.difficulty} />
                </div>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{loc.city} &middot; {loc.category}</p>
                <div className="mt-1.5 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {loc.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {loc.likesCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {loc.commentsCount}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/locations/${loc.slug}/edit`} className="btn-outline px-3 py-2">
                  <Edit3 className="h-4 w-4" />
                </Link>
                <button onClick={() => handleDelete(loc.slug)} className="btn-outline border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
