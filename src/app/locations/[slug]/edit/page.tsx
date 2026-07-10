import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { LocationForm } from '@/components/locations/location-form';

export default async function EditLocationPage({ params }: { params: { slug: string } }) {
  const [location, user] = await Promise.all([
    prisma.location.findUnique({ where: { slug: params.slug }, include: { images: { orderBy: { order: 'asc' } } } }),
    getCurrentUser(),
  ]);
  if (!location) notFound();
  if (!user) redirect(`/login?next=/locations/${params.slug}/edit`);

  const isOwner = user.id === location.authorId;
  const isAdmin = user.role === 'ADMIN';
  if (!isOwner && !isAdmin) redirect(`/locations/${params.slug}`);

  const tags: string[] = (() => {
    try {
      const parsed = JSON.parse(location.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-neutral-100">Edit Location</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          {isOwner && !isAdmin
            ? 'Editing an approved location sends it back for a quick re-review.'
            : 'You are editing this location as an administrator.'}
        </p>
      </div>
      <LocationForm
        mode="edit"
        locationId={location.id}
        initialValues={{
          title: location.title,
          description: location.description,
          category: location.category,
          city: location.city,
          address: location.address ?? '',
          latitude: location.latitude,
          longitude: location.longitude,
          tags,
          bestTime: location.bestTime ?? '',
          accessibility: location.accessibility ?? '',
          parking: location.parking,
          difficulty: location.difficulty,
          images: location.images.map((img) => ({ url: img.url, width: img.width ?? 0, height: img.height ?? 0 })),
        }}
      />
    </div>
  );
}
