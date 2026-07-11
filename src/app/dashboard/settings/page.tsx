import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsForm } from './settings-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const sessionUser = (await getCurrentUser())!;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { fullName: true, bio: true, city: true, instagram: true, facebook: true, website: true, avatarUrl: true, coverUrl: true },
  });

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>
      <SettingsForm
        initial={{
          fullName: user.fullName,
          bio: user.bio ?? '',
          city: user.city ?? '',
          instagram: user.instagram ?? '',
          facebook: user.facebook ?? '',
          website: user.website ?? '',
          avatarUrl: user.avatarUrl,
          coverUrl: user.coverUrl,
        }}
      />
    </div>
  );
}