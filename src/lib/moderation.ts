import { prisma } from '@/lib/db';
import { haversineDistanceKm } from '@/lib/geo';

// A deliberately small, conservative list — flags the clearest cases without
// generating a wall of false positives. Extend as needed.
const BLOCKED_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'bastard',
  'nigger',
  'faggot',
  'whore',
  'slut',
];

const BLOCKED_PATTERN = new RegExp(
  `\\b(${BLOCKED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

export function containsProfanity(text: string): boolean {
  return BLOCKED_PATTERN.test(text);
}

export function censorProfanity(text: string): string {
  return text.replace(BLOCKED_PATTERN, (match) => match[0] + '*'.repeat(Math.max(match.length - 1, 1)));
}

// ---------------------------------------------------------------------------
// Rate limiting — simple in-memory sliding window. Good enough for a single
// Node process; swap for a Redis-backed limiter behind a load balancer.
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

// Periodically sweep expired buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export const RATE_LIMITS = {
  createLocation: { limit: 5, windowMs: 60 * 60 * 1000 },
  comment: { limit: 20, windowMs: 10 * 60 * 1000 },
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  passwordReset: { limit: 5, windowMs: 60 * 60 * 1000 },
  passwordResetVerify: { limit: 8, windowMs: 15 * 60 * 1000 },
};

// ---------------------------------------------------------------------------
// Duplicate location detection — flags near-identical submissions so the
// same spot doesn't get posted five times a day.
// ---------------------------------------------------------------------------

const DUPLICATE_RADIUS_KM = 0.15; // ~150m
const DUPLICATE_TITLE_THRESHOLD = 0.82; // similarity ratio

export async function findLikelyDuplicate(params: {
  title: string;
  latitude: number;
  longitude: number;
  excludeId?: string;
}) {
  const candidates = await prisma.location.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] },
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      latitude: { gte: params.latitude - 0.01, lte: params.latitude + 0.01 },
      longitude: { gte: params.longitude - 0.01, lte: params.longitude + 0.01 },
    },
    select: { id: true, title: true, slug: true, latitude: true, longitude: true },
    take: 25,
  });

  for (const candidate of candidates) {
    const distance = haversineDistanceKm(
      params.latitude,
      params.longitude,
      candidate.latitude,
      candidate.longitude
    );
    if (distance <= DUPLICATE_RADIUS_KM) {
      const similarity = titleSimilarity(params.title, candidate.title);
      if (similarity >= DUPLICATE_TITLE_THRESHOLD || distance <= 0.03) {
        return candidate;
      }
    }
  }
  return null;
}

/** Simple normalized Levenshtein-based similarity ratio in [0, 1]. */
function titleSimilarity(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 1;
  const distance = levenshtein(s1, s2);
  const maxLen = Math.max(s1.length, s2.length) || 1;
  return 1 - distance / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
