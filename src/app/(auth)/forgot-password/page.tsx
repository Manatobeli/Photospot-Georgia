'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
      setDevLink(data.devResetLink ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-base p-8">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>

      {sent ? (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">Check your email</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
          </p>
          {devLink && (
            <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-left text-xs dark:border-neutral-700 dark:bg-neutral-900">
              <p className="mb-1 font-semibold text-neutral-600 dark:text-neutral-300">
                Dev mode — no email provider configured:
              </p>
              <a href={devLink} className="break-all text-brand-600 hover:underline dark:text-brand-400">
                {devLink}
              </a>
            </div>
          )}
          <Link href="/login" className="btn-outline mt-6 inline-flex">
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-center font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Reset your password
          </h1>
          <p className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-base">Email</label>
              <input
                type="email"
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send reset link
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Remembered your password?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
