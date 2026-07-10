import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

const patchSchema = z.object({
  isBanned: z.boolean().optional(),
  bannedReason: z.string().max(300).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) return jsonError('User not found', 404);
    if (target.id === admin.id) return jsonError("You can't modify your own admin account here", 400);

    const data = patchSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        ...(data.isBanned !== undefined ? { isBanned: data.isBanned } : {}),
        ...(data.isBanned !== undefined ? { bannedReason: data.isBanned ? data.bannedReason || 'Violation of community guidelines' : null } : {}),
        ...(data.role ? { role: data.role } : {}),
      },
    });

    if (data.isBanned === true) {
      await createNotification({
        userId: target.id,
        actorId: admin.id,
        type: 'ACCOUNT_BANNED',
        message: `Your account was banned: ${updated.bannedReason}`,
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: data.isBanned !== undefined ? (data.isBanned ? 'BAN_USER' : 'UNBAN_USER') : 'UPDATE_USER_ROLE',
        details: `${data.isBanned !== undefined ? (data.isBanned ? 'Banned' : 'Unbanned') : 'Changed role for'} ${target.username}`,
        targetType: 'User',
        targetId: target.id,
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        isBanned: updated.isBanned,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) return jsonError('User not found', 404);
    if (target.id === admin.id) return jsonError("You can't delete your own admin account", 400);

    await prisma.user.delete({ where: { id: target.id } });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_USER',
        details: `Deleted user ${target.username} (${target.email})`,
        targetType: 'User',
        targetId: target.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
