import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 30;

    const [total, logs] = await Promise.all([
      prisma.adminLog.count(),
      prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { username: true, fullName: true, avatarUrl: true } } },
      }),
    ]);

    return NextResponse.json({ items: logs, total, page, pageSize, hasMore: page * pageSize < total });
  } catch (error) {
    return handleApiError(error);
  }
}
