import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Instagram, Facebook, Globe, MapPin, Calendar, Settings, Camera, CheckCircle2, Clock, Heart, Eye } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serializeCard } from '@/lib/serialize';
import { Avatar } from '@/components/ui/avatar';
import { LocationGrid } from '@/components/locations/location-grid';

async function getProfile(username: string, viewerId?: string, isAdmin?: boolean) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      bio: true,
      city: true,
      avatarUrl: true,
      coverUrl: true,
      instagram: true,
      facebook: true,
      website: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const isSelf = viewerId === user.id;
  const visibilityFilter = isSelf || isAdmin ? {} : { status: 'APPROVED' as const };

  const [uploaded, approved, pending, rejected, favoritesCount, viewsAgg, locations] = await Promise.all([
    prisma.location.count({ where: { authorId: user.id } }),
    prisma.location.count({ where: { authorId: user.id, status: 'APPROVED' } }),
    prisma.location.count({ where: { authorId: user.id, status: 'PENDING' } }),
    prisma.location.count({ where: { authorId: user.id, status: 'REJECTED' } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.location.aggregate({ where: { authorId: user.id }, _sum: { views: true } }),
    prisma.location.findMany({
      where: { authorId: user.id, ...visibilityFilter },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        author: { select: { username: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  return {
    user,
    isSelf,
    stats: { uploaded, approved, pending, rejected, favorites: favoritesCount, totalViews: viewsAgg._sum.views ?? 0 },
    locations: locations.map(serializeCard),
  };
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { username: params.username }, select: { fullName: true, username: true } });
  if (!user) return {};
  return { title: `${user.fullName} (@${user.username})` };
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const viewer = await getCurrentUser();
  const profile = await getProfile(params.username, viewer?.id, viewer?.role === 'ADMIN');
  if (!profile) notFound();

  const { user, isSelf, stats, locations } = profile;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="card-base overflow-hidden">
        <div className="relative h-32 bg-brand-gradient sm:h-40">
          {user.coverUrl && <Image src={user.coverUrl} alt="" fill className="object-cover" />}
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <Avatar src={user.avatarUrl} name={user.fullName} size="xl" className="ring-4 ring-white dark:ring-neutral-900" />
            {isSelf && (
              <Link href="/dashboard/settings" className="btn-outline">
                <Settings className="h-4 w-4" /> Edit Profile
              </Link>
            )}
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">{user.fullName}</h1>
          <p className="text-neutral-500 dark:text-neutral-400">@{user.username}</p>

          {user.bio && <p className="mt-3 max-w-2xl text-neutral-700 dark:text-neutral-300">{user.bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            {user.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {user.city}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            {user.instagram && (
              <a href={`https://instagram.com/${user.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400">
                <Instagram className="h-4 w-4" /> {user.instagram}
              </a>
            )}
            {user.facebook && (
              <a href={user.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400">
                <Facebook className="h-4 w-4" /> Facebook
              </a>
            )}
            {user.website && (
              <a href={user.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400">
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard icon={Camera} label="Locations" value={stats.uploaded} />
            <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} />
            {isSelf && <StatCard icon={Clock} label="Pending" value={stats.pending} />}
            <StatCard icon={Heart} label="Favorites" value={stats.favorites} />
            <StatCard icon={Eye} label="Total Views" value={stats.totalViews} />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {isSelf ? 'My Locations' : `Locations by ${user.fullName}`}
        </h2>
        <LocationGrid
          items={locations}
          emptyTitle="No locations yet"
          emptyDescription={isSelf ? 'Upload your first photography spot to get started.' : 'This user has not published any locations yet.'}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Camera; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-900">
      <Icon className="mx-auto h-4 w-4 text-brand-600 dark:text-brand-400" />
      <p className="mt-1 font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}
