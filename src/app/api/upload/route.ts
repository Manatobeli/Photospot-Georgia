import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/upload';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { rateLimit } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const rl = rateLimit(`upload:${user.id}`, 60, 60 * 60 * 1000);
    if (!rl.allowed) return jsonError('Upload limit reached. Try again later.', 429);

    const formData = await req.formData();
    const subdirRaw = formData.get('type');
    const subdir = subdirRaw === 'avatars' ? 'avatars' : 'locations';
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) return jsonError('No files provided', 400);
    if (subdir === 'locations' && files.length > 12) {
      return jsonError('Maximum 12 images per location', 400);
    }

    const results = await Promise.all(files.map((file) => saveUploadedImage(file, subdir)));

    return NextResponse.json({ images: results });
  } catch (error) {
    return handleApiError(error);
  }
}
