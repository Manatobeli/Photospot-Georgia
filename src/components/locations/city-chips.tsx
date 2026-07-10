import Link from 'next/link';
import { GEORGIA_CITIES } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function CityChips({ className, activeCity }: { className?: string; activeCity?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {GEORGIA_CITIES.map((city) => (
        <Link
          key={city}
          href={`/search?city=${encodeURIComponent(city)}`}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            activeCity === city
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:text-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
          )}
        >
          {city}
        </Link>
      ))}
    </div>
  );
}
