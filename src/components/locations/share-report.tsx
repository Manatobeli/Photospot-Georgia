'use client';

import { useState } from 'react';
import { Share2, Flag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';

const REPORT_REASONS = [
  'Inappropriate content',
  'Incorrect location',
  'Duplicate submission',
  'Private property / no access',
  'Spam',
  'Other',
];

export function ShareButton({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/locations/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard copy if the user cancels or share fails
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleShare} className="btn-outline">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      Share
    </button>
  );
}

export function ReportButton({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) {
      router.push(`/login?next=/locations/${slug}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${slug}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Thanks — our team will take a look.');
      setOpen(false);
      setDetails('');
    } catch (err: any) {
      toast.error(err.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost">
        <Flag className="h-4 w-4" />
        Report
      </button>
      {open && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="card-base w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-100">Report this location</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label-base">Reason</label>
                <select className="input-base" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Additional details (optional)</label>
                <textarea className="input-base min-h-[80px]" value={details} onChange={(e) => setDetails(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
              <button onClick={submit} disabled={submitting} className="btn-danger">
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
