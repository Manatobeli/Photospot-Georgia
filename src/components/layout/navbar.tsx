'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Map, Search, Plus, Menu, X, LayoutDashboard, ShieldCheck, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { NotificationBell } from '@/components/notifications/notification-bell';

const NAV_LINKS = [
  { href: '/map', label: 'Explore Map', icon: Map },
  { href: '/search', label: 'Search', icon: Search },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-neutral-200/70 dark:border-neutral-800/70">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/locations/new" className="btn-primary">
                <Plus className="h-4 w-4" />
                Upload Location
              </Link>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)} className="ml-1 flex items-center">
                  <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 w-56 animate-scale-in rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-card-hover dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.fullName}
                      </p>
                      <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
                    </div>
                    <MenuLink href={`/profile/${user.username}`} icon={UserIcon} onClick={() => setMenuOpen(false)}>
                      My Profile
                    </MenuLink>
                    <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </MenuLink>
                    {user.role === 'ADMIN' && (
                      <MenuLink href="/admin" icon={ShieldCheck} onClick={() => setMenuOpen(false)}>
                        Admin Panel
                      </MenuLink>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 md:hidden dark:text-neutral-200"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="animate-slide-up border-t border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/locations/new" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30">
                  <Plus className="h-4 w-4" /> Upload Location
                </Link>
                <Link href={`/profile/${user.username}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
                  <UserIcon className="h-4 w-4" /> My Profile
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/dashboard/notifications" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
                  <Bell className="h-4 w-4" /> Notifications
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
                    <ShieldCheck className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="btn-outline flex-1">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary flex-1">
                  Sign up
                </Link>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof UserIcon;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
