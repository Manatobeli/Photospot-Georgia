import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Compass, ParkingCircle, Eye, Edit3 } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { haversineDistanceKm } from '@/lib/geo';
import { serializeCard } from '@/lib/serialize';
import { DifficultyBadge, StatusBadge, Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { GalleryWithLightbox } from '@/components/locations/gallery-with-lightbox';
import { MiniMap } from '@/components/locations/mini-map';
import { LikeFavoriteBar } from '@/components/locations/like-favorite-bar';
import { ShareButton, ReportButton } from '@/components/locations/share-report';
import { CommentsSection } from '@/components/locations/comments-section';
import { ViewTracker } from '@/components/locations/view-tracker';
import { STATUS_LABELS } from '@/lib/constants';

async function getLocation(slug: string) {
  return prisma.location.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: 'asc' } },
      author: { select: { id: true, username: true, fullName: true, avatarUrl: true, city: true, createdAt: true } },
      _count: { select: { likes: true, comments: true, favorites: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const location = await getLocation(params.slug);
  if (!location) return {};
  return {
    title: location.title,
    description: location.description.slice(0, 160),
    openGraph: {
      title: location.title,
      description: location.description.slice(0, 160),
      images: location.images[0] ? [{ url: location.images[0].url }] : [],
    },
  };
}

export default async function LocationDetailPage({ params }: { params: { slug: string } }) {
  const [location, viewer] = await Promise.all([getLocation(params.slug), getCurrentUser()]);
  if (!location) notFound();

  const isOwner = viewer?.id === location.authorId;
  const isAdmin = viewer?.role === 'ADMIN';
  if (location.status !== 'APPROVED' && !isOwner && !isAdmin) notFound();

  const [likedByMe, favoritedByMe] = viewer
    ? await Promise.all([
        prisma.like.findUnique({ where: { userId_locationId: { userId: viewer.id, locationId: location.id } } }),
        prisma.favorite.findUnique({ where: { userId_locationId: { userId: viewer.id, locationId: location.id } } }),
      ])
    : [null, null];

  const tags: string[] = (() => {
    try {
      const parsed = JSON.parse(location.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  // Nearby approved locations within 20km, computed server-side.
  const latDelta = 20 / 111.32;
  const lngDelta = 20 / (111.32 * Math.cos((location.latitude * Math.PI) / 180) || 1);
  const nearbyCandidates = await prisma.location.findMany({
    where: {
      status: 'APPROVED',
      id: { not: location.id },
      latitude: { gte: location.latitude - latDelta, lte: location.latitude + latDelta },
      longitude: { gte: location.longitude - lngDelta, lte: location.longitude + lngDelta },
    },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      author: { select: { username: true, fullName: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
    take: 40,
  });
  const nearby = nearbyCandidates
    .map((loc) => ({ loc, distanceKm: haversineDistanceKm(location.latitude, location.longitude, loc.latitude, loc.longitude) }))
    .filter((x) => x.distanceKm <= 20)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4)
    .map(({ loc, distanceKm }) => ({ ...serializeCard(loc), distanceKm: Math.round(distanceKm * 10) / 10 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {location.status === 'APPROVED' && <ViewTracker slug={location.slug} />}

      {location.status !== 'APPROVED' && (isOwner || isAdmin) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              This location is not public yet — status: {STATUS_LABELS[location.status]}
            </p>
            {location.rejectionNote && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">Note from admin: {location.rejectionNote}</p>
            )}
          </div>
          <StatusBadge status={location.status} />
        </div>
      )}

      <GalleryWithLightbox images={location.images} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{location.category}</Badge>
                <DifficultyBadge difficulty={location.difficulty} />
                {location.parking && (
                  <Badge variant="info">
                    <ParkingCircle className="h-3 w-3" /> Parking available
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">{location.title}</h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <MapPin className="h-4 w-4" /> {location.address ? `${location.address}, ` : ''}{location.city}, Georgia
              </p>
            </div>
            {(isOwner || isAdmin) && (
              <Link href={`/locations/${location.slug}/edit`} className="btn-outline">
                <Edit3 className="h-4 w-4" /> Edit
              </Link>
            )}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <LikeFavoriteBar
              slug={location.slug}
              initialLiked={!!likedByMe}
              initialLikesCount={location._count.likes}
              initialFavorited={!!favoritedByMe}
              initialFavoritesCount={location._count.favorites}
            />
            <ShareButton title={location.title} slug={location.slug} />
            <ReportButton slug={location.slug} />
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Eye className="h-4 w-4" /> {location.views} views
            <span className="mx-1">&middot;</span>
            <Calendar className="h-4 w-4" /> Added {new Date(location.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          <p className="mt-6 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{location.description}</p>

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="badge bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {location.bestTime && (
              <div className="card-base p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  <Compass className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Best time to shoot
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{location.bestTime}</p>
              </div>
            )}
            {location.accessibility && (
              <div className="card-base p-4">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Accessibility notes</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{location.accessibility}</p>
              </div>
            )}
          </div>

          <div className="mt-10">
            <h2 className="mb-3 font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">Map location</h2>
            <MiniMap
              id={location.id}
              slug={location.slug}
              title={location.title}
              city={location.city}
              category={location.category}
              latitude={location.latitude}
              longitude={location.longitude}
              coverImage={location.images[0]?.url ?? null}
            />
            <p className="mt-2 font-mono text-xs text-neutral-400">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>

          <div className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
            <CommentsSection slug={location.slug} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-base p-5">
            <p className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Uploaded by</p>
            <Link href={`/profile/${location.author.username}`} className="flex items-center gap-3">
              <Avatar src={location.author.avatarUrl} name={location.author.fullName} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{location.author.fullName}</p>
                <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">@{location.author.username}</p>
              </div>
            </Link>
            <Link href={`/profile/${location.author.username}`} className="btn-outline mt-4 w-full justify-center">
              View Profile
            </Link>
          </div>

          {nearby.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Nearby locations
              </h3>
              <div className="space-y-4">
                {nearby.map((loc) => (
                  <Link key={loc.id} href={`/locations/${loc.slug}`} className="card-base card-hover flex gap-3 overflow-hidden p-2">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {loc.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={loc.coverImage} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{loc.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{loc.city} &middot; {loc.distanceKm} km away</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
