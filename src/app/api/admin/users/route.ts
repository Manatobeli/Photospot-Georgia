import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 20;

    const where = q
      ? {
          OR: [
            { username: { contains: q } },
            { email: { contains: q } },
            { fullName: { contains: q } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { locations: true } },
        },
      }),
    ]);

    return NextResponse.json({ items: users, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (error) {
    return handleApiError(error);
  }
}
