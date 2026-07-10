import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { REPORT_STATUSES } from '@/types';

const patchSchema = z.object({
  status: z.enum(REPORT_STATUSES as unknown as [string, ...string[]]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) return jsonError('Report not found', 404);

    const { status } = patchSchema.parse(await req.json());

    const updated = await prisma.report.update({ where: { id: report.id }, data: { status } });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_REPORT_STATUS',
        details: `Marked report ${report.id} as ${status}`,
        targetType: 'Report',
        targetId: report.id,
      },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
