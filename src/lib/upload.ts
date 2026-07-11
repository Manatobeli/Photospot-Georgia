import 'server-only';
import crypto from 'crypto';
import sharp from 'sharp';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-admin';

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_DIMENSION = 2400;

export class UploadError extends Error {}

export async function saveUploadedImage(
  file: File,
  subdir: 'locations' | 'avatars' | 'covers'
): Promise<{ url: string; width: number; height: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const hash = crypto.randomBytes(12).toString('hex');
  const filename = `${Date.now()}-${hash}.webp`;
  const objectPath = `${subdir}/${filename}`;

  let pipeline = sharp(inputBuffer).rotate();
  const metadata = await pipeline.metadata();

  if ((metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const output = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, output.data, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    console.error('Supabase Storage upload failed:', error);
    throw new UploadError('Could not save image. Please try again.');
  }

  const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);

  return {
    url: publicUrlData.publicUrl,
    width: output.info.width,
    height: output.info.height,
  };
}
