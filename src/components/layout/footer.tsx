'use client';

import Link from 'next/link';
import { Instagram, Facebook, Camera } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { GEORGIA_CITIES } from '@/lib/constants';
import { useAuth } from '@/components/providers/auth-provider';

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
              Discover, upload, and share beautiful photography locations across Georgia.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-brand-100 hover:text-brand-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-brand-100 hover:text-brand-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li><Link href="/map" className="hover:text-brand-600 dark:hover:text-brand-400">Interactive Map</Link></li>
              <li><Link href="/search" className="hover:text-brand-600 dark:hover:text-brand-400">Search Locations</Link></li>
              <li><Link href="/search?sort=trending" className="hover:text-brand-600 dark:hover:text-brand-400">Trending</Link></li>
              <li><Link href="/locations/new" className="hover:text-brand-600 dark:hover:text-brand-400">Upload a Location</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100">Popular Cities</h4>
            <ul className="mt-3 space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              {GEORGIA_CITIES.slice(0, 5).map((city) => (
                <li key={city}>
                  <Link href={`/search?city=${encodeURIComponent(city)}`} className="hover:text-brand-600 dark:hover:text-brand-400">
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              {user ? (
                <>
                  <li><Link href={`/profile/${user.username}`} className="hover:text-brand-600 dark:hover:text-brand-400">My Profile</Link></li>
                  <li><Link href="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400">Dashboard</Link></li>
                  <li><Link href="/dashboard/settings" className="hover:text-brand-600 dark:hover:text-brand-400">Settings</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/login" className="hover:text-brand-600 dark:hover:text-brand-400">Log in</Link></li>
                  <li><Link href="/register" className="hover:text-brand-600 dark:hover:text-brand-400">Sign up</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-400 dark:border-neutral-800 sm:flex-row">
          <p className="flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" /> © {new Date().getFullYear()} PhotoSpot Georgia. All rights reserved.
          </p>
          <p>Made for photographers, models &amp; creators across Georgia</p>
        </div>
      </div>
    </footer>
  );
}