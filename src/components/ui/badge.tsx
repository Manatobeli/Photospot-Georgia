import { cn } from '@/lib/cn';
import { DIFFICULTY_LABELS, STATUS_LABELS } from '@/lib/constants';

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const variants: Record<string, string> = {
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  };
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const variant = difficulty === 'EASY' ? 'success' : difficulty === 'MEDIUM' ? 'warning' : 'danger';
  return <Badge variant={variant}>{DIFFICULTY_LABELS[difficulty] ?? difficulty}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'APPROVED'
      ? 'success'
      : status === 'PENDING'
        ? 'warning'
        : status === 'CHANGES_REQUESTED'
          ? 'info'
          : 'danger';
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}
