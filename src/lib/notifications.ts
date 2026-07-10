import { prisma } from '@/lib/db';
import type { NotificationType } from '@/types';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  actorId?: string | null;
}

/** Creates a notification, silently skipping if the user is notifying themself. */
export async function createNotification({
  userId,
  type,
  message,
  link,
  actorId,
}: CreateNotificationParams) {
  if (actorId && actorId === userId) return null;
  return prisma.notification.create({
    data: {
      userId,
      type,
      message,
      link,
      actorId: actorId ?? undefined,
    },
  });
}
