import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalLocations,
      pendingApprovals,
      approvedLocations,
      rejectedSubmissions,
      changesRequested,
      bannedUsers,
      totalComments,
      openReports,
      newestUsers,
      mostActiveUsersRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.location.count(),
      prisma.location.count({ where: { status: 'PENDING' } }),
      prisma.location.count({ where: { status: 'APPROVED' } }),
      prisma.location.count({ where: { status: 'REJECTED' } }),
      prisma.location.count({ where: { status: 'CHANGES_REQUESTED' } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.comment.count(),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, username: true, fullName: true, avatarUrl: true, createdAt: true, role: true },
      }),
      prisma.location.groupBy({
        by: ['authorId'],
        _count: { authorId: true },
        orderBy: { _count: { authorId: 'desc' } },
        take: 8,
      }),
    ]);

    const activeUserIds = mostActiveUsersRaw.map((x) => x.authorId);
    const activeUsers = await prisma.user.findMany({
      where: { id: { in: activeUserIds } },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
    });
    const mostActiveUsers = mostActiveUsersRaw.map((row) => ({
      user: activeUsers.find((u) => u.id === row.authorId),
      locationCount: row._count.authorId,
    }));

    return NextResponse.json({
      totals: {
        totalUsers,
        totalLocations,
        pendingApprovals,
        approvedLocations,
        rejectedSubmissions,
        changesRequested,
        bannedUsers,
        totalComments,
        openReports,
      },
      newestUsers,
      mostActiveUsers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
