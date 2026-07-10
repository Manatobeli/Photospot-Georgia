import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { reportSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    });
    if (!location) return jsonError('Location not found', 404);

    const { reason, details } = reportSchema.parse(await req.json());

    const report = await prisma.report.create({
      data: { locationId: location.id, reporterId: user.id, reason, details: details || null },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
