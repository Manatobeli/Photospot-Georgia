// Shared serializer for turning a Prisma Location (with images/author/_count
// included) into the plain LocationCardData shape used by client components.
// Server Components can't pass Date objects or Prisma's internal shapes
// directly into client components without a serialization boundary, so this
// keeps that logic in one place.
export function serializeCard(loc: any) {
  return {
    id: loc.id,
    slug: loc.slug,
    title: loc.title,
    city: loc.city,
    category: loc.category,
    difficulty: loc.difficulty,
    latitude: loc.latitude,
    longitude: loc.longitude,
    coverImage: loc.images?.[0]?.url ?? null,
    likesCount: loc._count?.likes ?? 0,
    commentsCount: loc._count?.comments ?? 0,
    views: loc.views,
    createdAt: loc.createdAt instanceof Date ? loc.createdAt.toISOString() : loc.createdAt,
    author: loc.author,
  };
}
