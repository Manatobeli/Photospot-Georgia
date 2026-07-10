'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2, Edit3 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { MapPinOff } from 'lucide-react';
import { cn } from '@/lib/cn';

const STATUS_TABS = ['', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'];

interface AdminLocation {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  status: string;
  coverImage: string | null;
  createdAt: string;
  author: { username: string; fullName: string };
}

export function AllLocationsClient() {
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '60' });
    if (status) params.set('status', status);
    const res = await fetch(`/api/locations?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleDelete(slug: string) {
    if (!confirm('Permanently delete this location?')) return;
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
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium',
              status === s ? 'border-brand-500 bg-brand-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
            )}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState icon={MapPinOff} title="No locations found" />
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((loc) => (
                <tr key={loc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
                  <td className="px-4 py-3">
                    <Link href={`/locations/${loc.slug}`} target="_blank" className="font-medium text-neutral-800 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400">
                      {loc.title}
                    </Link>
                    <p className="text-xs text-neutral-400">{loc.city} &middot; {loc.category}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">@{loc.author.username}</td>
                  <td className="px-4 py-3"><StatusBadge status={loc.status} /></td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{new Date(loc.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/locations/${loc.slug}/edit`} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(loc.slug)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
