import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { serializeCard } from '@/lib/serialize';
import { LocationGrid } from '@/components/locations/location-grid';

export const metadata: Metadata = { title: 'Favorites' };

export default async function FavoritesPage() {
  const user = (await getCurrentUser())!;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      location: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          author: { select: { username: true, fullName: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });

  const items = favorites
    .filter((f) => f.location.status === 'APPROVED')
    .map((f) => serializeCard(f.location));

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Favorites</h1>
      <LocationGrid
        items={items}
        emptyTitle="No favorites yet"
        emptyDescription="Save locations you love by tapping the bookmark icon on any location page."
      />
    </div>
  );
}
