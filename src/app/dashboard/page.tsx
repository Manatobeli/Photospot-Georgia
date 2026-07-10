import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, CheckCircle2, Clock, XCircle, Heart, Eye, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { serializeCard } from '@/lib/serialize';
import { LocationGrid } from '@/components/locations/location-grid';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardOverviewPage() {
  const user = (await getCurrentUser())!;

  const [uploaded, approved, pending, rejected, favorites, viewsAgg, recent] = await Promise.all([
    prisma.location.count({ where: { authorId: user.id } }),
    prisma.location.count({ where: { authorId: user.id, status: 'APPROVED' } }),
    prisma.location.count({ where: { authorId: user.id, status: 'PENDING' } }),
    prisma.location.count({ where: { authorId: user.id, status: 'REJECTED' } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.location.aggregate({ where: { authorId: user.id }, _sum: { views: true } }),
    prisma.location.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        author: { select: { username: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Camera} label="Locations" value={uploaded} color="brand" />
        <StatCard icon={CheckCircle2} label="Approved" value={approved} color="success" />
        <StatCard icon={Clock} label="Pending" value={pending} color="warning" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} color="danger" />
        <StatCard icon={Heart} label="Favorites" value={favorites} color="brand" />
        <StatCard icon={Eye} label="Total Views" value={viewsAgg._sum.views ?? 0} color="info" />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">Recent Submissions</h2>
          <Link href="/dashboard/locations" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <LocationGrid
          items={recent.map(serializeCard).map((c, i) => ({ ...c, status: recent[i].status }))}
          emptyTitle="No submissions yet"
          emptyDescription="Upload your first photography location to see it here."
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Camera;
  label: string;
  value: number;
  color: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const colors: Record<string, string> = {
    brand: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    danger: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    info: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30',
  };
  return (
    <div className="card-base p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}
