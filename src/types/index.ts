// Central "enum-like" literal types. SQLite (used for local dev via Prisma)
// doesn't support native enums, so these are validated in application code
// instead — see src/lib/validation.ts for the zod schemas that enforce them.

export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const LOCATION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const NOTIFICATION_TYPES = [
  'POST_APPROVED',
  'POST_REJECTED',
  'CHANGES_REQUESTED',
  'COMMENT_RECEIVED',
  'COMMENT_REPLY',
  'LOCATION_LIKED',
  'COMMENT_LIKED',
  'ACCOUNT_BANNED',
  'ADMIN_MESSAGE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const REPORT_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  isBanned: boolean;
}

export interface LocationCardData {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  difficulty: Difficulty;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  likesCount: number;
  commentsCount: number;
  views: number;
  createdAt: string;
  author: {
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
