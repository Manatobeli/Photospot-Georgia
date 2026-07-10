'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">Something went wrong</h1>
      <p className="mt-1.5 max-w-sm text-neutral-500 dark:text-neutral-400">
        An unexpected error occurred. Try again, or head back to the homepage.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="btn-outline">
          <Home className="h-4 w-4" /> Go home
        </Link>
      </div>
    </div>
  );
}
