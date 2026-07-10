'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Flag, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const TABS = ['OPEN', 'REVIEWED', 'DISMISSED', ''];

interface ReportItem {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { username: string; fullName: string };
  location: { id: string; slug: string; title: string; status: string; images: { url: string }[] };
}

export function ReportsClient() {
  const [tab, setTab] = useState('OPEN');
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab) params.set('status', tab);
    const res = await fetch(`/api/admin/reports?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.reports || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Report marked as ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  return (
    <div>
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t || 'all'}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium',
              tab === t ? 'border-brand-500 bg-brand-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
            )}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Flag} title="No reports here" description="Nothing to review in this filter." />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card-base flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {r.location.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.location.images[0].url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/locations/${r.location.slug}`} target="_blank" className="font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400">
                    {r.location.title}
                  </Link>
                  <Badge variant="danger">{r.reason}</Badge>
                </div>
                {r.details && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{r.details}</p>}
                <p className="mt-1 text-xs text-neutral-400">
                  Reported by @{r.reporter.username} &middot; {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              {r.status === 'OPEN' && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => updateStatus(r.id, 'REVIEWED')} className="btn-outline px-3 py-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Reviewed
                  </button>
                  <button onClick={() => updateStatus(r.id, 'DISMISSED')} className="btn-outline px-3 py-1.5 text-xs text-neutral-500">
                    <XCircle className="h-3.5 w-3.5" /> Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
