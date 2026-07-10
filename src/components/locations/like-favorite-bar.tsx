'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useAuth } from '@/components/providers/auth-provider';

export function LikeFavoriteBar({
  slug,
  initialLiked,
  initialLikesCount,
  initialFavorited,
  initialFavoritesCount,
}: {
  slug: string;
  initialLiked: boolean;
  initialLikesCount: number;
  initialFavorited: boolean;
  initialFavoritesCount: number;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount);
  const [busy, setBusy] = useState(false);

  function requireAuth() {
    if (!user) {
      toast.message('Log in to continue', { description: 'Create a free account to like and save locations.' });
      router.push(`/login?next=/locations/${slug}`);
      return false;
    }
    return true;
  }

  async function toggleLike() {
    if (!requireAuth() || busy) return;
    setBusy(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const res = await fetch(`/api/locations/${slug}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((c) => c + (nextLiked ? -1 : 1));
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!requireAuth() || busy) return;
    setBusy(true);
    const nextFav = !favorited;
    setFavorited(nextFav);
    setFavoritesCount((c) => c + (nextFav ? 1 : -1));
    try {
      const res = await fetch(`/api/locations/${slug}/favorite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFavorited(data.favorited);
      setFavoritesCount(data.favoritesCount);
      toast.success(data.favorited ? 'Saved to favorites' : 'Removed from favorites');
    } catch {
      setFavorited(!nextFav);
      setFavoritesCount((c) => c + (nextFav ? -1 : 1));
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLike}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
          liked
            ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
            : 'border-neutral-200 text-neutral-600 hover:border-red-200 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-300'
        )}
      >
        <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
        {likesCount}
      </button>
      <button
        onClick={toggleFavorite}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
          favorited
            ? 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-400'
            : 'border-neutral-200 text-neutral-600 hover:border-brand-200 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-300'
        )}
      >
        <Bookmark className={cn('h-4 w-4', favorited && 'fill-current')} />
        {favoritesCount}
      </button>
    </div>
  );
}
