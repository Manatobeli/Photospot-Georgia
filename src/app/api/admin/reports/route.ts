import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();

    const reports = await prisma.report.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: { select: { username: true, fullName: true, avatarUrl: true } },
        location: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}
