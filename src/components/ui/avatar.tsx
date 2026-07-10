import Image from 'next/image';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
};

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      <div
        className={cn('relative shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-neutral-900', className)}
        style={{ width: px, height: px }}
      >
        <Image src={src} alt={name} fill sizes={`${px}px`} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white ring-2 ring-white dark:ring-neutral-900',
        className
      )}
      style={{ width: px, height: px, fontSize: px * 0.38 }}
    >
      {initials || '?'}
    </div>
  );
}
