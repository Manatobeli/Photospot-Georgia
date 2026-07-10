'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Trash2, Reply, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/cn';

interface CommentAuthor {
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  author: CommentAuthor;
  _count: { likes: number };
  replies?: CommentData[];
  likedByMe?: boolean;
}

export function CommentsSection({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/locations/${slug}/comments`, { cache: 'no-store' });
      const data = await res.json();
      setComments(data.comments || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function postComment(text: string, parentId?: string) {
    if (!user) {
      router.push(`/login?next=/locations/${slug}`);
      return;
    }
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), data.comment] } : c))
        );
        setReplyBody('');
        setReplyTo(null);
      } else {
        setComments((prev) => [data.comment, ...prev]);
        setBody('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: string, parentId?: string) {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: (c.replies || []).filter((r) => r.id !== id) } : c))
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not delete comment');
    }
  }

  async function toggleCommentLike(id: string, parentId?: string) {
    if (!user) {
      router.push(`/login?next=/locations/${slug}`);
      return;
    }
    try {
      const res = await fetch(`/api/comments/${id}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updater = (c: CommentData) =>
        c.id === id ? { ...c, _count: { likes: data.likesCount }, likedByMe: data.liked } : c;
      setComments((prev) =>
        parentId
          ? prev.map((c) => (c.id === parentId ? { ...c, replies: (c.replies || []).map(updater) } : c))
          : prev.map(updater)
      );
    } catch {
      toast.error('Something went wrong');
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Comments {comments.length > 0 && <span className="text-neutral-400">({comments.length})</span>}
      </h2>

      <div className="mt-4 flex gap-3">
        <Avatar src={user?.avatarUrl} name={user?.fullName || '?'} size="sm" />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={user ? 'Share your thoughts…' : 'Log in to leave a comment'}
            className="input-base min-h-[70px] resize-y"
            disabled={submitting}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => postComment(body)}
              disabled={submitting || !body.trim()}
              className="btn-primary"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-neutral-400">No comments yet — be the first to share your thoughts.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              <CommentRow
                comment={comment}
                canDelete={user?.id === comment.authorId}
                onDelete={() => deleteComment(comment.id)}
                onLike={() => toggleCommentLike(comment.id)}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              />

              {replyTo === comment.id && (
                <div className="ml-11 mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Reply to ${comment.author.username}…`}
                    className="input-base flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && postComment(replyBody, comment.id)}
                  />
                  <button onClick={() => postComment(replyBody, comment.id)} className="btn-secondary">
                    Reply
                  </button>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 mt-3 space-y-3 border-l-2 border-neutral-100 pl-4 dark:border-neutral-800">
                  {comment.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      canDelete={user?.id === reply.authorId}
                      onDelete={() => deleteComment(reply.id, comment.id)}
                      onLike={() => toggleCommentLike(reply.id, comment.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  canDelete,
  onDelete,
  onLike,
  onReply,
}: {
  comment: CommentData;
  canDelete: boolean;
  onDelete: () => void;
  onLike: () => void;
  onReply?: () => void;
}) {
  return (
    <div className="flex gap-3">
      <Avatar src={comment.author.avatarUrl} name={comment.author.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{comment.author.username}</span>
          <span className="text-xs text-neutral-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-neutral-700 dark:text-neutral-300">{comment.body}</p>
        <div className="mt-1.5 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <button onClick={onLike} className={cn('flex items-center gap-1 hover:text-red-600', comment.likedByMe && 'text-red-600')}>
            <Heart className={cn('h-3.5 w-3.5', comment.likedByMe && 'fill-current')} /> {comment._count.likes}
          </button>
          {onReply && (
            <button onClick={onReply} className="flex items-center gap-1 hover:text-brand-600">
              <Reply className="h-3.5 w-3.5" /> Reply
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="flex items-center gap-1 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
