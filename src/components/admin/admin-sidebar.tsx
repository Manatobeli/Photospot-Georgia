'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, MapPin, Users, ScrollText, ShieldCheck, Flag } from 'lucide-react';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/pending', label: 'Pending Review', icon: Clock },
  { href: '/admin/locations', label: 'All Locations', icon: MapPin },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/logs', label: 'Admin Logs', icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="mb-4 flex items-center gap-2 px-1">
        <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <span className="font-display font-semibold text-neutral-900 dark:text-neutral-100">Admin Panel</span>
      </div>
      <nav className="card-base flex flex-row gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
