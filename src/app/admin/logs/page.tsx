import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { admin: { select: { username: true, fullName: true, avatarUrl: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin Logs</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">Audit trail of moderation actions.</p>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No admin actions yet" />
      ) : (
        <div className="card-base divide-y divide-neutral-100 overflow-hidden dark:divide-neutral-800">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-4">
              <Avatar src={log.admin.avatarUrl} name={log.admin.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-700 dark:text-neutral-200">
                  <span className="font-semibold">@{log.admin.username}</span>{' '}
                  <span className="font-mono text-xs text-neutral-400">[{log.action}]</span>
                </p>
                {log.details && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{log.details}</p>}
              </div>
              <span className="shrink-0 text-xs text-neutral-400">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
