import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    });
    if (!location) return jsonError('Location not found', 404);

    const existing = await prisma.favorite.findUnique({
      where: { userId_locationId: { userId: user.id, locationId: location.id } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, locationId: location.id } });
    }

    const count = await prisma.favorite.count({ where: { locationId: location.id } });
    return NextResponse.json({ favorited: !existing, favoritesCount: count });
  } catch (error) {
    return handleApiError(error);
  }
}
