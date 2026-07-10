import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const viewer = await getCurrentUser();
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        city: true,
        avatarUrl: true,
        instagram: true,
        facebook: true,
        website: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) return jsonError('User not found', 404);

    const isSelf = viewer?.id === user.id;
    const locationWhere = isSelf || viewer?.role === 'ADMIN' ? {} : { status: 'APPROVED' as const };

    const [uploaded, approved, pending, rejected, favoritesCount, totalViewsAgg] = await Promise.all([
      prisma.location.count({ where: { authorId: user.id } }),
      prisma.location.count({ where: { authorId: user.id, status: 'APPROVED' } }),
      prisma.location.count({ where: { authorId: user.id, status: 'PENDING' } }),
      prisma.location.count({ where: { authorId: user.id, status: 'REJECTED' } }),
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.location.aggregate({ where: { authorId: user.id }, _sum: { views: true } }),
    ]);

    const recentLocations = await prisma.location.findMany({
      where: { authorId: user.id, ...locationWhere },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({
      user,
      stats: {
        uploaded,
        approved,
        pending,
        rejected,
        favorites: favoritesCount,
        totalViews: totalViewsAgg._sum.views ?? 0,
      },
      locations: recentLocations.map(serializeLocationCard),
      isSelf,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function serializeLocationCard(loc: any) {
  return {
    id: loc.id,
    slug: loc.slug,
    title: loc.title,
    city: loc.city,
    category: loc.category,
    status: loc.status,
    difficulty: loc.difficulty,
    latitude: loc.latitude,
    longitude: loc.longitude,
    coverImage: loc.images[0]?.url ?? null,
    likesCount: loc._count.likes,
    commentsCount: loc._count.comments,
    views: loc.views,
    createdAt: loc.createdAt,
  };
}
