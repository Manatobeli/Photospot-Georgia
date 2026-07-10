import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { updateLocationSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { containsProfanity, findLikelyDuplicate } from '@/lib/moderation';
import { isValidLatLng } from '@/lib/geo';

async function findLocationByIdOrSlug(idOrSlug: string) {
  return prisma.location.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      images: { orderBy: { order: 'asc' } },
      author: {
        select: { id: true, username: true, fullName: true, avatarUrl: true, city: true, createdAt: true },
      },
      _count: { select: { likes: true, comments: true, favorites: true } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewer = await getCurrentUser();
    const location = await findLocationByIdOrSlug(params.id);
    if (!location) return jsonError('Location not found', 404);

    const isOwner = viewer?.id === location.authorId;
    const isAdmin = viewer?.role === 'ADMIN';
    if (location.status !== 'APPROVED' && !isOwner && !isAdmin) {
      return jsonError('Location not found', 404);
    }

    const [likedByMe, favoritedByMe] = viewer
      ? await Promise.all([
          prisma.like.findUnique({ where: { userId_locationId: { userId: viewer.id, locationId: location.id } } }),
          prisma.favorite.findUnique({
            where: { userId_locationId: { userId: viewer.id, locationId: location.id } },
          }),
        ])
      : [null, null];

    return NextResponse.json({
      location: {
        ...location,
        tags: safeParseTags(location.tags),
        likesCount: location._count.likes,
        commentsCount: location._count.comments,
        favoritesCount: location._count.favorites,
        likedByMe: !!likedByMe,
        favoritedByMe: !!favoritedByMe,
        isOwner,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    });
    if (!location) return jsonError('Location not found', 404);

    const isOwner = location.authorId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return jsonError('Not authorized to edit this location', 403);

    const body = await req.json();
    const data = updateLocationSchema.parse(body);

    if (data.latitude !== undefined && data.longitude !== undefined) {
      if (!isValidLatLng(data.latitude, data.longitude)) {
        return jsonError('Invalid map coordinates', 400);
      }
    }
    if (
      (data.title && containsProfanity(data.title)) ||
      (data.description && containsProfanity(data.description))
    ) {
      return jsonError('Please remove inappropriate language', 400);
    }
    if (data.title && data.latitude !== undefined && data.longitude !== undefined) {
      const duplicate = await findLikelyDuplicate({
        title: data.title,
        latitude: data.latitude,
        longitude: data.longitude,
        excludeId: location.id,
      });
      if (duplicate) {
        return jsonError(`This looks like a duplicate of "${duplicate.title}"`, 409);
      }
    }

    // A non-admin editing their own post after approval sends it back to
    // review, since the content has changed.
    const shouldResetToPending = isOwner && !isAdmin && location.status === 'APPROVED';

    const updated = await prisma.location.update({
      where: { id: location.id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.tags ? { tags: JSON.stringify(data.tags) } : {}),
        ...(data.bestTime !== undefined ? { bestTime: data.bestTime || null } : {}),
        ...(data.accessibility !== undefined ? { accessibility: data.accessibility || null } : {}),
        ...(data.parking !== undefined ? { parking: data.parking } : {}),
        ...(data.difficulty ? { difficulty: data.difficulty } : {}),
        ...(data.images
          ? {
              images: {
                deleteMany: {},
                create: data.images.map((url, index) => ({ url, order: index, isCover: index === 0 })),
              },
            }
          : {}),
        ...(shouldResetToPending ? { status: 'PENDING', rejectionNote: null, reviewedById: null, reviewedAt: null } : {}),
      },
      include: { images: true },
    });

    return NextResponse.json({ location: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    });
    if (!location) return jsonError('Location not found', 404);

    const isOwner = location.authorId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return jsonError('Not authorized to delete this location', 403);

    await prisma.location.delete({ where: { id: location.id } });

    if (isAdmin && !isOwner) {
      await prisma.adminLog.create({
        data: {
          adminId: user.id,
          action: 'DELETE_LOCATION',
          details: `Deleted "${location.title}"`,
          targetType: 'Location',
          targetId: location.id,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

function safeParseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
