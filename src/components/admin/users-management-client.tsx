'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Ban, ShieldCheck, Trash2, Search, ShieldOff } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  isBanned: boolean;
  createdAt: string;
  _count: { locations: number };
}

export function UsersManagementClient() {
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(query: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggleBan(user: AdminUser) {
    const reason = !user.isBanned ? prompt('Reason for ban (shown to the user):') : undefined;
    if (!user.isBanned && reason === null) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !user.isBanned, bannedReason: reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.map((u) => (u.id === user.id ? { ...u, isBanned: !u.isBanned } : u)));
      toast.success(user.isBanned ? 'User unbanned' : 'User banned');
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  async function toggleRole(user: AdminUser) {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change ${user.username}'s role to ${nextRole}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
      toast.success(`Role updated to ${nextRole}`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  async function removeUser(user: AdminUser) {
    if (!confirm(`Permanently delete ${user.username}? This deletes all their locations too.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems((prev) => prev.filter((u) => u.id !== user.id));
      toast.success('User deleted');
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  return (
    <div>
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, username, or email…" className="input-base pl-10" />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Locations</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
                  <td className="px-4 py-3">
                    <Link href={`/profile/${user.username}`} className="flex items-center gap-2.5" target="_blank">
                      <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-800 dark:text-neutral-100">{user.fullName}</p>
                        <p className="truncate text-xs text-neutral-400">@{user.username} &middot; {user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{user._count.locations}</td>
                  <td className="px-4 py-3">
                    {user.isBanned ? <Badge variant="danger">Banned</Badge> : <Badge variant="success">Active</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {user.id !== me?.id && (
                        <>
                          <button onClick={() => toggleRole(user)} title="Toggle admin role" className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <button onClick={() => toggleBan(user)} title={user.isBanned ? 'Unban' : 'Ban'} className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40">
                            {user.isBanned ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                          <button onClick={() => removeUser(user)} title="Delete" className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
