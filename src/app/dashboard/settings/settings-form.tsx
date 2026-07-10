'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Save, Camera } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { GEORGIA_CITIES } from '@/lib/constants';

interface InitialProfile {
  fullName: string;
  bio: string;
  city: string;
  instagram: string;
  facebook: string;
  website: string;
  avatarUrl: string | null;
}

export function SettingsForm({ initial }: { initial: InitialProfile }) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(initial);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof InitialProfile>(key: K, value: InitialProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.set('type', 'avatars');
      formData.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAvatarUrl(data.images[0].url);
    } catch (err: any) {
      toast.error(err.message || 'Could not upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (user) setUser({ ...user, ...data.user });
      toast.success('Profile updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-base space-y-5 p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-gradient">
          {avatarUrl && <Image src={avatarUrl} alt="" fill className="object-cover" />}
        </div>
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} className="btn-outline">
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Change photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
        </div>
      </div>

      <div>
        <label className="label-base">Full name</label>
        <input className="input-base" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required minLength={2} />
      </div>

      <div>
        <label className="label-base">Bio</label>
        <textarea className="input-base min-h-[90px]" value={form.bio} onChange={(e) => update('bio', e.target.value)} maxLength={500} placeholder="Tell the community about yourself…" />
      </div>

      <div>
        <label className="label-base">City</label>
        <select className="input-base" value={form.city} onChange={(e) => update('city', e.target.value)}>
          <option value="">Not specified</option>
          {GEORGIA_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label-base">Instagram</label>
          <input className="input-base" value={form.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="@username" />
        </div>
        <div>
          <label className="label-base">Facebook</label>
          <input className="input-base" value={form.facebook} onChange={(e) => update('facebook', e.target.value)} placeholder="https://facebook.com/…" />
        </div>
        <div>
          <label className="label-base">Website</label>
          <input className="input-base" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
