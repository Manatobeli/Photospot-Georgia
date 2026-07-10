import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_DIMENSION = 2400;

export class UploadError extends Error {}

/**
 * Accepts a browser File from a multipart form, validates it, compresses /
 * resizes it, and writes it to /public/uploads/<subdir>/<hash>.webp.
 * Returns the public URL plus final dimensions.
 */
export async function saveUploadedImage(
  file: File,
  subdir: 'locations' | 'avatars'
): Promise<{ url: string; width: number; height: number }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError('Only JPEG, PNG, WEBP or AVIF images are allowed');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError('Image must be smaller than 8MB');
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const hash = crypto.randomBytes(12).toString('hex');
  const filename = `${Date.now()}-${hash}.webp`;
  const outputPath = path.join(dir, filename);

  let pipeline = sharp(inputBuffer).rotate(); // auto-orient via EXIF
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
  await writeFile(outputPath, output.data);

  return {
    url: `/uploads/${subdir}/${filename}`,
    width: output.info.width,
    height: output.info.height,
  };
}
