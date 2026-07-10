'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { DifficultyBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface PendingLocation {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  difficulty: string;
  coverImage: string | null;
  createdAt: string;
  author: { username: string; fullName: string; avatarUrl: string | null };
}

type ActionType = 'reject' | 'changes' | null;

export function PendingReviewClient() {
  const [items, setItems] = useState<PendingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; type: ActionType; title: string } | null>(null);
  const [note, setNote] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/locations?status=PENDING&pageSize=48', { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/locations/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Location approved and published');
    } catch (err: any) {
      toast.error(err.message || 'Could not approve');
    } finally {
      setBusyId(null);
    }
  }

  async function submitAction() {
    if (!modal) return;
    setBusyId(modal.id);
    try {
      const endpoint = modal.type === 'reject' ? 'reject' : 'request-changes';
      const res = await fetch(`/api/admin/locations/${modal.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.filter((i) => i.id !== modal.id));
      toast.success(modal.type === 'reject' ? 'Location rejected' : 'Changes requested');
      setModal(null);
      setNote('');
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading pending submissions…</p>;

  if (items.length === 0) {
    return <EmptyState icon={CheckCircle2} title="All caught up" description="There are no locations waiting for review." />;
  }

  return (
    <div>
      <div className="space-y-4">
        {items.map((loc) => (
          <div key={loc.id} className="card-base flex flex-col gap-4 p-4 sm:flex-row">
            <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 sm:h-28 sm:w-40">
              {loc.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={loc.coverImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  <MapPin className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/locations/${loc.slug}`} target="_blank" className="font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400">
                  {loc.title}
                </Link>
                <DifficultyBadge difficulty={loc.difficulty} />
              </div>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{loc.city} &middot; {loc.category}</p>
              <div className="mt-2 flex items-center gap-2">
                <Avatar src={loc.author.avatarUrl} name={loc.author.fullName} size="xs" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  @{loc.author.username} &middot; submitted {new Date(loc.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => approve(loc.id)} disabled={busyId === loc.id} className="btn-primary bg-emerald-600 px-3 py-1.5 text-xs shadow-none hover:brightness-100 hover:bg-emerald-700">
                  {busyId === loc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => setModal({ id: loc.id, type: 'changes', title: loc.title })}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  <AlertCircle className="h-3.5 w-3.5" /> Request Changes
                </button>
                <button
                  onClick={() => setModal({ id: loc.id, type: 'reject', title: loc.title })}
                  className="btn-outline border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div className="card-base w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {modal.type === 'reject' ? 'Reject' : 'Request changes for'} &ldquo;{modal.title}&rdquo;
            </h3>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={modal.type === 'reject' ? 'Explain why this submission is being rejected…' : 'Describe what needs to change…'}
              className="input-base mt-4 min-h-[100px]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
              <button onClick={submitAction} disabled={!note.trim() || busyId === modal.id} className="btn-danger">
                {busyId === modal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
