import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, MapPin, Clock, CheckCircle2, XCircle, Ban, MessageCircle, Flag, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    totalLocations,
    pendingApprovals,
    approvedLocations,
    rejectedSubmissions,
    changesRequested,
    bannedUsers,
    totalComments,
    openReports,
    newestUsers,
    mostActiveRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.location.count(),
    prisma.location.count({ where: { status: 'PENDING' } }),
    prisma.location.count({ where: { status: 'APPROVED' } }),
    prisma.location.count({ where: { status: 'REJECTED' } }),
    prisma.location.count({ where: { status: 'CHANGES_REQUESTED' } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.comment.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, username: true, fullName: true, avatarUrl: true, createdAt: true } }),
    prisma.location.groupBy({ by: ['authorId'], _count: { authorId: true }, orderBy: { _count: { authorId: 'desc' } }, take: 6 }),
  ]);

  const activeUsers = await prisma.user.findMany({
    where: { id: { in: mostActiveRaw.map((r) => r.authorId) } },
    select: { id: true, username: true, fullName: true, avatarUrl: true },
  });
  const mostActive = mostActiveRaw.map((r) => ({
    user: activeUsers.find((u) => u.id === r.authorId),
    count: r._count.authorId,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin Overview</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">Platform-wide statistics and moderation queue.</p>
      </div>

      {pendingApprovals > 0 && (
        <Link href="/admin/pending" className="card-base flex items-center justify-between border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <span className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
            <Clock className="h-4 w-4" /> {pendingApprovals} location{pendingApprovals === 1 ? '' : 's'} waiting for review
          </span>
          <ArrowRight className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} href="/admin/users" />
        <StatCard icon={MapPin} label="Total Locations" value={totalLocations} href="/admin/locations" />
        <StatCard icon={Clock} label="Pending Approvals" value={pendingApprovals} href="/admin/pending" />
        <StatCard icon={CheckCircle2} label="Approved" value={approvedLocations} href="/admin/locations" />
        <StatCard icon={XCircle} label="Rejected" value={rejectedSubmissions} href="/admin/locations" />
        <StatCard icon={MessageCircle} label="Changes Requested" value={changesRequested} href="/admin/locations" />
        <StatCard icon={Ban} label="Banned Users" value={bannedUsers} href="/admin/users" />
        <StatCard icon={Flag} label="Open Reports" value={openReports} href="/admin/reports" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-base p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">Newest Users</h2>
          <div className="space-y-3">
            {newestUsers.map((u) => (
              <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3">
                <Avatar src={u.avatarUrl} name={u.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{u.fullName}</p>
                  <p className="truncate text-xs text-neutral-400">@{u.username}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-base p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">Top Contributors</h2>
          <div className="space-y-3">
            {mostActive.map(
              (item, i) =>
                item.user && (
                  <Link key={item.user.id} href={`/profile/${item.user.username}`} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-center text-xs font-bold text-neutral-400">{i + 1}</span>
                    <Avatar src={item.user.avatarUrl} name={item.user.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.user.fullName}</p>
                      <p className="truncate text-xs text-neutral-400">@{item.user.username}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-300">{item.count} spots</span>
                  </Link>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card-base card-hover block p-4">
        {content}
      </Link>
    );
  }
  return <div className="card-base p-4">{content}</div>;
}
