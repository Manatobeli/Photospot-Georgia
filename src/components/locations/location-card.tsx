'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Eye, MapPin } from 'lucide-react';
import { DifficultyBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import type { LocationCardData } from '@/types';

export function LocationCard({
  location,
  distanceKm,
  priority = false,
}: {
  location: LocationCardData;
  distanceKm?: number;
  priority?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      <Link
        href={`/locations/${location.slug}`}
        className="card-base card-hover group block overflow-hidden"
      >
        <div className="relative h-48 w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          {location.coverImage ? (
            <Image
              src={location.coverImage}
              alt={location.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <MapPin className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-hero-gradient" />
          <div className="absolute left-3 top-3">
            <DifficultyBadge difficulty={location.difficulty} />
          </div>
          {distanceKm !== undefined && (
            <div className="absolute right-3 top-3 badge bg-black/60 text-white backdrop-blur-sm">
              {distanceKm} km away
            </div>
          )}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
            <span className="badge bg-white/20 backdrop-blur-sm">{location.category}</span>
            <span className="flex items-center gap-1 text-xs font-medium">
              <MapPin className="h-3 w-3" /> {location.city}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-display text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {location.title}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={location.author.avatarUrl} name={location.author.fullName} size="xs" />
              <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {location.author.username}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> {location.likesCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {location.commentsCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {location.views}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
