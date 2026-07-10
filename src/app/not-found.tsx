import Link from 'next/link';
import { Compass, Home, Map } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-brand-gradient-soft px-4 text-center dark:bg-neutral-950">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow">
        <Compass className="h-9 w-9" />
      </div>
      <h1 className="mt-6 font-display text-5xl font-extrabold text-neutral-900 dark:text-neutral-100">404</h1>
      <p className="mt-2 text-lg font-semibold text-neutral-700 dark:text-neutral-300">This spot doesn&apos;t exist on the map</p>
      <p className="mt-1 max-w-sm text-neutral-500 dark:text-neutral-400">
        The page you&apos;re looking for may have been moved, deleted, or never existed.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link href="/map" className="btn-outline">
          <Map className="h-4 w-4" /> Explore map
        </Link>
      </div>
    </div>
  );
}
