'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { useAuth } from '@/components/providers/auth-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setUser(data.user);
      toast.success(`Welcome to PhotoSpot Georgia, ${data.user.fullName.split(' ')[0]}!`);
      router.push('/dashboard');
      router.refresh();
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
      <h1 className="text-center font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Create your account
      </h1>
      <p className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Join the community and start discovering photo spots.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label-base">Full name</label>
          <input
            className="input-base"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="Nino Beridze"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label-base">Username</label>
          <input
            className="input-base"
            value={form.username}
            onChange={(e) => update('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder="nino_photo"
            required
          />
        </div>
        <div>
          <label className="label-base">Email</label>
          <input
            type="email"
            className="input-base"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="label-base">Password</label>
          <input
            type="password"
            className="input-base"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
