import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from '@/lib/auth';
import { UploadError } from '@/lib/upload';

/** Wraps a route handler body, translating known errors into clean JSON responses. */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError(error.errors[0]?.message ?? 'Invalid input', 400);
  }
  if (error instanceof UploadError) {
    return jsonError(error.message, 400);
  }
  console.error(error);
  return jsonError('Something went wrong. Please try again.', 500);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
