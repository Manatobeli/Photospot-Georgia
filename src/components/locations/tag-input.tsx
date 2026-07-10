'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export function TagInput({
  tags,
  onChange,
  max = 15,
  placeholder = 'Add a tag and press Enter…',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const value = draft.trim().replace(/,+$/, '');
    if (!value) return;
    if (tags.includes(value)) {
      setDraft('');
      return;
    }
    if (tags.length >= max) return;
    onChange([...tags, value]);
    setDraft('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="input-base flex flex-wrap items-center gap-1.5 py-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
        >
          #{tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-brand-900 dark:hover:text-white">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {tags.length < max && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm outline-none placeholder:text-neutral-400"
        />
      )}
    </div>
  );
}
