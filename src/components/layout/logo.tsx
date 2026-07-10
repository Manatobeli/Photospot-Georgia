import Link from 'next/link';
import { Camera } from 'lucide-react';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
        <Camera className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white">
        PhotoSpot <span className="text-brand-600 dark:text-brand-400">Georgia</span>
      </span>
    </Link>
  );
}
