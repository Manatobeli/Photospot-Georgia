'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, MapPin } from 'lucide-react';
import { ImageUploader, type UploadedImage } from '@/components/locations/image-uploader';
import { TagInput } from '@/components/locations/tag-input';
import { LocationPickerMapClient } from '@/components/map/dynamic';
import { CATEGORIES, GEORGIA_CITIES } from '@/lib/constants';
import { DIFFICULTIES } from '@/types';

export interface LocationFormValues {
  title: string;
  description: string;
  category: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  bestTime: string;
  accessibility: string;
  parking: boolean;
  difficulty: string;
  images: UploadedImage[];
}

const EMPTY_FORM: LocationFormValues = {
  title: '',
  description: '',
  category: '',
  city: '',
  address: '',
  latitude: null,
  longitude: null,
  tags: [],
  bestTime: '',
  accessibility: '',
  parking: false,
  difficulty: 'EASY',
  images: [],
};

export function LocationForm({
  mode,
  locationId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  locationId?: string;
  initialValues?: Partial<LocationFormValues>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LocationFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof LocationFormValues>(key: K, value: LocationFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.latitude || !form.longitude) {
      setError('Please set the exact location on the map');
      return;
    }
    if (form.images.length === 0) {
      setError('Upload at least one photo');
      return;
    }
    if (!form.category) {
      setError('Choose a category');
      return;
    }
    if (!form.city) {
      setError('Choose a city');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        city: form.city,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        tags: form.tags,
        bestTime: form.bestTime,
        accessibility: form.accessibility,
        parking: form.parking,
        difficulty: form.difficulty,
        images: form.images.map((i) => i.url),
      };

      const res = await fetch(mode === 'create' ? '/api/locations' : `/api/locations/${locationId}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      toast.success(
        mode === 'create'
          ? 'Location submitted! It will appear once an admin approves it.'
          : 'Location updated.'
      );
      router.push('/dashboard/locations');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
      )}

      <FormSection title="Photos" description="Upload one or more photos of the location. The first photo becomes the cover image.">
        <ImageUploader images={form.images} onChange={(images) => update('images', images)} />
      </FormSection>

      <FormSection title="Basics" description="Give your location a clear title and helpful description.">
        <div className="space-y-4">
          <div>
            <label className="label-base">Location title</label>
            <input
              className="input-base"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Sunset Viewpoint at Narikala Fortress"
              required
              minLength={4}
            />
          </div>
          <div>
            <label className="label-base">Description</label>
            <textarea
              className="input-base min-h-[120px] resize-y"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe what makes this spot great for photography, how to get there, lighting conditions, etc."
              required
              minLength={20}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-base">Category</label>
              <select className="input-base" value={form.category} onChange={(e) => update('category', e.target.value)} required>
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">City</label>
              <select className="input-base" value={form.city} onChange={(e) => update('city', e.target.value)} required>
                <option value="" disabled>Select a city</option>
                {GEORGIA_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-base">Address (optional)</label>
            <input
              className="input-base"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Street address or landmark"
            />
          </div>
          <div>
            <label className="label-base">Tags</label>
            <TagInput tags={form.tags} onChange={(tags) => update('tags', tags)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Exact map location" description="Click the map, search an address, or drag the marker to pin the precise spot." icon={MapPin}>
        <LocationPickerMapClient
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={(lat, lng) => {
            update('latitude', lat);
            update('longitude', lng);
          }}
        />
      </FormSection>

      <FormSection title="Photography details" description="Help other photographers plan their visit.">
        <div className="space-y-4">
          <div>
            <label className="label-base">Best time for photography</label>
            <input
              className="input-base"
              value={form.bestTime}
              onChange={(e) => update('bestTime', e.target.value)}
              placeholder="e.g. Golden hour, sunrise, weekday mornings"
            />
          </div>
          <div>
            <label className="label-base">Accessibility notes</label>
            <textarea
              className="input-base min-h-[80px] resize-y"
              value={form.accessibility}
              onChange={(e) => update('accessibility', e.target.value)}
              placeholder="Terrain, hiking distance, wheelchair access, permits needed, etc."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-base">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update('difficulty', d)}
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      form.difficulty === d
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-base">Parking</label>
              <label className="flex h-[42px] items-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={form.parking}
                  onChange={(e) => update('parking', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                Parking available nearby
              </label>
            </div>
          </div>
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-outline">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === 'create' ? 'Submit for review' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <section className="card-base p-6">
      <div className="mb-5 flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-5 w-5 text-brand-600 dark:text-brand-400" />}
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
