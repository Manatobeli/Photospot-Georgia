import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, getCurrentUser } from '@/lib/auth';
import { createLocationSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { slugify, randomSuffix } from '@/lib/slugify';
import { haversineDistanceKm, isValidLatLng } from '@/lib/geo';
import { containsProfanity, findLikelyDuplicate, rateLimit, RATE_LIMITS } from '@/lib/moderation';

const PAGE_SIZE_DEFAULT = 24;

// ---------------------------------------------------------------------------
// GET /api/locations — public listing with filters, search, distance radius,
// sorting, and pagination.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const viewer = await getCurrentUser();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.trim();
    const city = searchParams.get('city')?.trim();
    const category = searchParams.get('category')?.trim();
    const difficulty = searchParams.get('difficulty')?.trim();
    const sort = searchParams.get('sort') || 'recent'; // recent | trending | mostViewed | mostLiked
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(48, parseInt(searchParams.get('pageSize') || String(PAGE_SIZE_DEFAULT), 10));
    const featured = searchParams.get('featured') === 'true';
    const authorUsername = searchParams.get('author')?.trim();
    const statusParam = searchParams.get('status')?.trim();

    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const radiusKm = searchParams.get('radiusKm') ? parseFloat(searchParams.get('radiusKm')!) : null;

    const isAdmin = viewer?.role === 'ADMIN';
    const isOwnerViewingOwn = !!authorUsername && viewer?.username === authorUsername;
    // Owners viewing their own locations (or admins) can see every status;
    // everyone else only ever sees approved, published locations.
    const canSeeAllStatuses = isOwnerViewingOwn || isAdmin;

    const where: any = {};

    if (canSeeAllStatuses) {
      if (statusParam) where.status = statusParam;
      // no statusParam + canSeeAllStatuses -> no status filter (see everything)
    } else {
      where.status = 'APPROVED';
    }

    if (city) where.city = city;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (featured) where.featured = true;

    if (authorUsername) {
      const author = await prisma.user.findUnique({ where: { username: authorUsername } });
      if (!author) return NextResponse.json({ items: [], total: 0, page, pageSize, hasMore: false });
      where.authorId = author.id;
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { city: { contains: q } },
        { category: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'mostViewed') orderBy = { views: 'desc' };
    if (sort === 'mostLiked') orderBy = [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }];

    // Distance search: fetch a wider candidate set within a lat/lng bounding
    // box, then filter precisely with Haversine and paginate in memory.
    if (lat !== null && lng !== null && radiusKm) {
      const latDelta = radiusKm / 111.32;
      const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180) || 1);

      const candidates = await prisma.location.findMany({
        where: {
          ...where,
          latitude: { gte: lat - latDelta, lte: lat + latDelta },
          longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
        },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          author: { select: { username: true, fullName: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });

      const withDistance = candidates
        .map((loc) => ({
          loc,
          distanceKm: haversineDistanceKm(lat, lng, loc.latitude, loc.longitude),
        }))
        .filter((x) => x.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const total = withDistance.length;
      const start = (page - 1) * pageSize;
      const pageItems = withDistance.slice(start, start + pageSize);

      return NextResponse.json({
        items: pageItems.map(({ loc, distanceKm }) => ({
          ...serializeLocationCard(loc),
          distanceKm: Math.round(distanceKm * 10) / 10,
        })),
        total,
        page,
        pageSize,
        hasMore: start + pageSize < total,
      });
    }

    const [total, items] = await Promise.all([
      prisma.location.count({ where }),
      prisma.location.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          author: { select: { username: true, fullName: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);

    return NextResponse.json({
      items: items.map(serializeLocationCard),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/locations — create a new pending submission.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const rl = rateLimit(
      `create-location:${user.id}`,
      RATE_LIMITS.createLocation.limit,
      RATE_LIMITS.createLocation.windowMs
    );
    if (!rl.allowed) {
      return jsonError(`You're submitting too quickly. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`, 429);
    }

    const body = await req.json();
    const data = createLocationSchema.parse(body);

    if (!isValidLatLng(data.latitude, data.longitude)) {
      return jsonError('Invalid map coordinates', 400);
    }
    if (containsProfanity(data.title) || containsProfanity(data.description)) {
      return jsonError('Please remove inappropriate language from your submission', 400);
    }

    const duplicate = await findLikelyDuplicate({
      title: data.title,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    if (duplicate) {
      return jsonError(
        `This looks like a duplicate of an existing location: "${duplicate.title}". Please check before resubmitting.`,
        409
      );
    }

    const baseSlug = slugify(data.title) || 'location';
    let slug = baseSlug;
    let attempt = 0;
    
    while (await prisma.location.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${baseSlug}-${randomSuffix(4)}`;
      if (attempt > 5) break;
    }

    const isAdmin = user.role === 'ADMIN';
    const location = await prisma.location.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        category: data.category,
        city: data.city,
        address: data.address || null,
        latitude: data.latitude,
        longitude: data.longitude,
        tags: JSON.stringify(data.tags ?? []),
        bestTime: data.bestTime || null,
        accessibility: data.accessibility || null,
        parking: data.parking,
        difficulty: data.difficulty,
        status: isAdmin ? 'APPROVED' : 'PENDING',
        authorId: user.id,
        ...(isAdmin ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
        images: {
          create: data.images.map((url, index) => ({
            url,
            order: index,
            isCover: index === 0,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

function serializeLocationCard(loc: any) {
  return {
    id: loc.id,
    slug: loc.slug,
    title: loc.title,
    city: loc.city,
    category: loc.category,
    status: loc.status,
    difficulty: loc.difficulty,
    latitude: loc.latitude,
    longitude: loc.longitude,
    coverImage: loc.images[0]?.url ?? null,
    likesCount: loc._count.likes,
    commentsCount: loc._count.comments,
    views: loc.views,
    createdAt: loc.createdAt,
    author: loc.author,
  };
}
