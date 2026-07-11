'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, Save, Camera, Image as ImageIcon } from 'lucide-react';
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
  coverUrl: string | null;
}

export function SettingsForm({ initial }: { initial: InitialProfile }) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(initial);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

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

  async function handleCoverChange(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.set('type', 'covers');
      formData.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverUrl(data.images[0].url);
    } catch (err: any) {
      toast.error(err.message || 'Could not upload cover image');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatarUrl, coverUrl }),
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
    <form onSubmit={handleSubmit} className="card-base space-y-5 overflow-hidden p-0">
      <div className="relative h-36 w-full bg-brand-gradient sm:h-44">
        {coverUrl && <Image src={coverUrl} alt="" fill className="object-cover" />}
        <button
          type="button"
          onClick={() => coverFileRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          Change cover
        </button>
        <input ref={coverFileRef} type="file" accept="image/*" hidden onChange={(e) => handleCoverChange(e.target.files?.[0])} />

        <div className="absolute -bottom-10 left-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-gradient ring-4 ring-white dark:ring-neutral-900">
            {avatarUrl && <Image src={avatarUrl} alt="" fill className="object-cover" />}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 pb-6 pt-12">
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} className="btn-outline">
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Change profile photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
        </div>

        <div>
          <label className="label-base">Full name</label>
          <input className="input-base" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required minLength={2} />
        </div>

        <div>
          <label className="label-base">Bio</label>
          <textarea
            className="input-base min-h-[140px] resize-y"
            rows={6}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            maxLength={1000}
            placeholder="Tell the community about yourself…"
          />
          <p className="mt-1 text-right text-xs text-neutral-400">{form.bio.length}/1000</p>
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
      </div>
    </form>
  );
}