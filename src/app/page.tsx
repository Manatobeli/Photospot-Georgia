import Link from 'next/link';
import { Map, Search, TrendingUp, Sparkles, Camera, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { LocationGrid } from '@/components/locations/location-grid';
import { CityChips } from '@/components/locations/city-chips';
import { CategoryChips } from '@/components/locations/category-chips';
import { serializeCard } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [featured, recent, trending, totalLocations, totalUsers] = await Promise.all([
    prisma.location.findMany({
      where: { status: 'APPROVED', featured: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        author: { select: { username: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.location.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        author: { select: { username: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.location.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ views: 'desc' }],
      take: 8,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        author: { select: { username: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.location.count({ where: { status: 'APPROVED' } }),
    prisma.user.count(),
  ]);

  return {
    featured: featured.map(serializeCard),
    recent: recent.map(serializeCard),
    trending: trending.map(serializeCard),
    totalLocations,
    totalUsers,
  };
}

export default async function HomePage() {
  const { featured, recent, trending, totalLocations, totalUsers } = await getHomeData();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-gradient-soft dark:bg-neutral-950">
        <div className="absolute inset-0 bg-brand-gradient opacity-[0.06] dark:opacity-[0.12]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge mb-5 inline-flex bg-white/80 text-brand-700 shadow-soft dark:bg-neutral-900/80 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> {totalLocations}+ photo spots across Georgia
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white">
              Find your next{' '}
              <span className="bg-brand-gradient bg-clip-text text-transparent">photoshoot location</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
              Discover breathtaking locations across Georgia — from Tbilisi rooftops to Svaneti peaks —
              scouted and shared by a community of photographers, models, and creators.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/map" className="btn-primary px-7 py-3 text-base">
                <Map className="h-5 w-5" /> Explore the Map
              </Link>
              <Link href="/search" className="btn-outline bg-white/70 px-7 py-3 text-base backdrop-blur dark:bg-neutral-900/60">
                <Search className="h-5 w-5" /> Search Locations
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
              <Stat icon={Camera} value={`${totalLocations}+`} label="Locations" />
              <Stat icon={Users} value={`${totalUsers}+`} label="Contributors" />
              <Stat icon={ShieldCheck} value="100%" label="Admin-reviewed" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        {/* City chips */}
        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">Browse by city</h2>
          <CityChips className="mt-4" />
        </section>

        {/* Category chips */}
        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">Browse by category</h2>
          <CategoryChips className="mt-4" />
        </section>

        {featured.length > 0 && (
          <Section
            title="Featured Locations"
            icon={Sparkles}
            href="/search?featured=true"
          >
            <LocationGrid items={featured} />
          </Section>
        )}

        <Section title="Trending Now" icon={TrendingUp} href="/search?sort=mostViewed">
          <LocationGrid items={trending} />
        </Section>

        <Section title="Recently Added" icon={Camera} href="/search?sort=recent">
          <LocationGrid items={recent} />
        </Section>

        {/* CTA */}
        <section className="card-base relative overflow-hidden bg-brand-gradient p-10 text-center text-white">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Know a hidden gem?</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/90">
            Share it with the community. Every submission is reviewed before going live, so the map
            stays full of genuinely great spots.
          </p>
          <Link href="/locations/new" className="btn-secondary mt-6 inline-flex bg-white text-brand-700 hover:bg-white/90">
            Upload a Location <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Camera; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
      <span className="font-semibold text-neutral-800 dark:text-neutral-100">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: typeof Camera;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">
          <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" /> {title}
        </h2>
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}
