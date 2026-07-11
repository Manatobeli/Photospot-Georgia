import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { editProfileSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/api-utils';

export async function PATCH(req: NextRequest) {
  try {
    const me = await requireUser();
    const data = editProfileSchema.parse(await req.json());

    const user = await prisma.user.update({
      where: { id: me.id },
      data: {
        fullName: data.fullName,
        bio: data.bio || null,
        city: data.city || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        website: data.website || null,
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl || null } : {}),
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        role: user.role,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}