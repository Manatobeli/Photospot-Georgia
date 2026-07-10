import { z } from 'zod';
import { CATEGORIES, GEORGIA_CITIES } from '@/lib/constants';
import { DIFFICULTIES } from '@/types';

const usernameRegex = /^[a-zA-Z0-9_.]{3,24}$/;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  username: z
    .string()
    .trim()
    .regex(usernameRegex, 'Username must be 3-24 characters: letters, numbers, "_" or "."'),
  fullName: z.string().trim().min(2, 'Full name is too short').max(80),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional().default(true),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const editProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  instagram: z.string().trim().max(80).optional().or(z.literal('')),
  facebook: z.string().trim().max(120).optional().or(z.literal('')),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^https?:\/\//.test(v), 'Website must start with http:// or https://'),
  avatarUrl: z.string().optional(),
});

export const createLocationSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(4000),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  city: z.enum(GEORGIA_CITIES as unknown as [string, ...string[]]),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  tags: z.array(z.string().trim().min(1).max(30)).max(15).default([]),
  bestTime: z.string().trim().max(120).optional().or(z.literal('')),
  accessibility: z.string().trim().max(500).optional().or(z.literal('')),
  parking: z.boolean().default(false),
  difficulty: z.enum(DIFFICULTIES as unknown as [string, ...string[]]),
  images: z.array(z.string()).min(1, 'Upload at least one image').max(12, 'Maximum 12 images'),
});
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial();

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
  parentId: z.string().optional().nullable(),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(3).max(100),
  details: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const adminRejectSchema = z.object({
  note: z.string().trim().min(3, 'Please explain why this is rejected').max(1000),
});

export const adminChangesSchema = z.object({
  note: z.string().trim().min(3, 'Please describe what changes are needed').max(1000),
});

export function formatZodError(error: z.ZodError): string {
  const first = error.errors[0];
  return first ? first.message : 'Invalid input';
}
