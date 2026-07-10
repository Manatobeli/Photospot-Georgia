import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { adminRejectSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const location = await prisma.location.findUnique({ where: { id: params.id } });
    if (!location) return jsonError('Location not found', 404);

    const { note } = adminRejectSchema.parse(await req.json());

    const updated = await prisma.location.update({
      where: { id: location.id },
      data: { status: 'REJECTED', rejectionNote: note, reviewedById: admin.id, reviewedAt: new Date() },
    });

    await Promise.all([
      createNotification({
        userId: location.authorId,
        actorId: admin.id,
        type: 'POST_REJECTED',
        message: `Your location "${location.title}" was rejected: ${note}`,
        link: `/dashboard/locations`,
      }),
      prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'REJECT_LOCATION',
          details: `Rejected "${location.title}": ${note}`,
          targetType: 'Location',
          targetId: location.id,
        },
      }),
    ]);

    return NextResponse.json({ location: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
