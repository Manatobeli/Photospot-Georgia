import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function CategoryChips({ className, activeCategory }: { className?: string; activeCategory?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/search?category=${encodeURIComponent(category)}`}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            activeCategory === category
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-neutral-200 bg-white text-neutral-600 hover:border-teal-300 hover:text-teal-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
          )}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
