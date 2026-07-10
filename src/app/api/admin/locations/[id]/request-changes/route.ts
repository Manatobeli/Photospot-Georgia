import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { adminChangesSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const location = await prisma.location.findUnique({ where: { id: params.id } });
    if (!location) return jsonError('Location not found', 404);

    const { note } = adminChangesSchema.parse(await req.json());

    const updated = await prisma.location.update({
      where: { id: location.id },
      data: { status: 'CHANGES_REQUESTED', rejectionNote: note, reviewedById: admin.id, reviewedAt: new Date() },
    });

    await Promise.all([
      createNotification({
        userId: location.authorId,
        actorId: admin.id,
        type: 'CHANGES_REQUESTED',
        message: `Changes were requested for "${location.title}": ${note}`,
        link: `/dashboard/locations`,
      }),
      prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'REQUEST_CHANGES',
          details: `Requested changes on "${location.title}": ${note}`,
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
