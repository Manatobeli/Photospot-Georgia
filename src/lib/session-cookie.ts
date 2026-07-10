// Deliberately dependency-free (no Prisma, no jsonwebtoken) so it can be
// safely imported from src/middleware.ts, which runs on Next.js's Edge
// Runtime and cannot load Node-only modules like @prisma/client.
export const SESSION_COOKIE_NAME = 'ps_session';
