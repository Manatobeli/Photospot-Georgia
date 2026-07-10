import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locations = await prisma.location.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true, updatedAt: true },
    take: 5000,
  });

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/map`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.8 },
    ...locations.map((loc) => ({
      url: `${SITE_URL}/locations/${loc.slug}`,
      lastModified: loc.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
