'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reset password');
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card-base p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This link is missing a reset token. Request a new one from the{' '}
          <Link href="/forgot-password" className="text-brand-600 hover:underline dark:text-brand-400">
            forgot password
          </Link>{' '}
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="card-base p-8">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      {done ? (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Password updated
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Redirecting you to log in…</p>
        </div>
      ) : (
        <>
          <h1 className="text-center font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Set a new password
          </h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-base">New password</label>
              <input
                type="password"
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label-base">Confirm password</label>
              <input
                type="password"
                className="input-base"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
