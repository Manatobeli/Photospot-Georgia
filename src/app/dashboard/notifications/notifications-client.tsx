'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, CheckCircle2, XCircle, AlertCircle, Ban, Megaphone } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const ICONS: Record<string, typeof Bell> = {
  POST_APPROVED: CheckCircle2,
  POST_REJECTED: XCircle,
  CHANGES_REQUESTED: AlertCircle,
  COMMENT_RECEIVED: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  LOCATION_LIKED: Heart,
  COMMENT_LIKED: Heart,
  ACCOUNT_BANNED: Ban,
  ADMIN_MESSAGE: Megaphone,
};

export function NotificationsClient() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    const data = await res.json();
    setItems(data.notifications || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="card-base divide-y divide-neutral-100 overflow-hidden dark:divide-neutral-800">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const row = (
              <div
                onClick={() => !n.read && markRead(n.id)}
                className={cn('flex gap-3 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60', !n.read && 'bg-brand-50/60 dark:bg-brand-900/10')}
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-700 dark:text-neutral-200">{n.message}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
                {!n.read && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </div>
            );
            return <div key={n.id}>{n.link ? <Link href={n.link}>{row}</Link> : row}</div>;
          })}
        </div>
      )}
    </div>
  );
}
