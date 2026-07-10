import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { haversineDistanceKm } from '@/lib/geo';

const NEARBY_RADIUS_KM = 20;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
      select: { id: true, latitude: true, longitude: true },
    });
    if (!location) return jsonError('Location not found', 404);

    const latDelta = NEARBY_RADIUS_KM / 111.32;
    const lngDelta = NEARBY_RADIUS_KM / (111.32 * Math.cos((location.latitude * Math.PI) / 180) || 1);

    const candidates = await prisma.location.findMany({
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

    const nearby = candidates
      .map((loc) => ({
        loc,
        distanceKm: haversineDistanceKm(location.latitude, location.longitude, loc.latitude, loc.longitude),
      }))
      .filter((x) => x.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8)
      .map(({ loc, distanceKm }) => ({
        id: loc.id,
        slug: loc.slug,
        title: loc.title,
        city: loc.city,
        category: loc.category,
        difficulty: loc.difficulty,
        coverImage: loc.images[0]?.url ?? null,
        likesCount: loc._count.likes,
        commentsCount: loc._count.comments,
        views: loc.views,
        distanceKm: Math.round(distanceKm * 10) / 10,
        author: loc.author,
      }));

    return NextResponse.json({ items: nearby });
  } catch (error) {
    return handleApiError(error);
  }
}
