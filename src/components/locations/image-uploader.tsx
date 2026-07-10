'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

export function ImageUploader({
  images,
  onChange,
  max = 12,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).slice(0, max - images.length);
      if (files.length === 0) {
        toast.error(`You can upload up to ${max} images`);
        return;
      }

      setUploading(true);
      try {
        const uploaded: UploadedImage[] = [];
        for (const file of files) {
          const formData = new FormData();
          formData.set('type', 'locations');
          formData.append('files', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Upload failed for "${file.name}"`);
          uploaded.push(...data.images);
        }
        onChange([...images, ...uploaded]);
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [images, max, onChange]
  );


  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl2 border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-neutral-300 hover:border-brand-400 dark:border-neutral-700'
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        ) : (
          <UploadCloud className="h-8 w-8 text-neutral-400" />
        )}
        <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {uploading ? 'Uploading…' : 'Click or drag photos here'}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">JPEG, PNG or WEBP up to 4MB each — {images.length}/{max} added</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img, i) => (
            <div key={img.url} className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
              <Image src={img.url} alt="" fill sizes="150px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-2.5 w-2.5 fill-current" /> Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
