'use client';

import { MapPinned, X } from 'lucide-react';
import { RADIUS_OPTIONS_KM } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function RadiusSearchPanel({
  active,
  onToggle,
  origin,
  radiusKm,
  onRadiusChange,
  onClearOrigin,
}: {
  active: boolean;
  onToggle: () => void;
  origin: { lat: number; lng: number } | null;
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onClearOrigin: () => void;
}) {
  return (
    <div className="card-base p-4">
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between rounded-xl px-1 py-1 text-left text-sm font-semibold',
          active ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-800 dark:text-neutral-100'
        )}
      >
        <span className="flex items-center gap-2">
          <MapPinned className="h-4 w-4" /> Distance search
        </span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs', active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800')}>
          {active ? 'On' : 'Off'}
        </span>
      </button>

      {active && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Click anywhere on the map to set your search point, then choose a radius.
          </p>
          {origin ? (
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              <span className="font-mono">{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</span>
              <button onClick={onClearOrigin} className="text-neutral-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-300 px-2.5 py-2 text-center text-xs text-neutral-400 dark:border-neutral-700">
              No point selected yet
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {RADIUS_OPTIONS_KM.map((km) => (
              <button
                key={km}
                onClick={() => onRadiusChange(km)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  radiusKm === km
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-brand-300 dark:border-neutral-700 dark:text-neutral-300'
                )}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
