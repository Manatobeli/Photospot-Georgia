/**
 * Seeds the database with an admin account, a handful of demo users, and a
 * set of sample locations (mostly approved, a few pending/rejected) so the
 * app is immediately explorable after `npm run db:seed`.
 *
 * Demo photos are loaded from https://picsum.photos using a fixed seed per
 * location, so images are deterministic but still require internet access
 * at request time (they're just <img>/<Image> URLs, not files we download).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@photospot.ge';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

function picsum(seed: string, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const DEMO_USERS = [
  { username: 'nino_photo', fullName: 'Nino Beridze', email: 'nino@example.com', city: 'Tbilisi', bio: 'Portrait & street photographer based in Tbilisi.' },
  { username: 'giorgi_lens', fullName: 'Giorgi Kapanadze', email: 'giorgi@example.com', city: 'Batumi', bio: 'Drone & landscape photography across Adjara.' },
  { username: 'mari_shoots', fullName: 'Mariam Lomidze', email: 'mari@example.com', city: 'Kutaisi', bio: 'Wedding photographer, always scouting new venues.' },
  { username: 'levan_explores', fullName: 'Levan Tabatadze', email: 'levan@example.com', city: 'Mestia', bio: 'Mountain guide and adventure photographer.' },
];

const LOCATIONS = [
  {
    title: 'Sunset Viewpoint at Narikala Fortress',
    description:
      'One of the most iconic viewpoints in Tbilisi. Climb up to the fortress walls just before sunset for golden-hour light over the old town, the Kura river, and the Bridge of Peace. Best reached via the cable car from Rike Park or on foot through the botanical garden.',
    category: 'Historical',
    city: 'Tbilisi',
    lat: 41.6879,
    lng: 44.8095,
    tags: ['sunset', 'cityscape', 'fortress', 'golden-hour'],
    bestTime: 'Golden hour, 1 hour before sunset',
    accessibility: 'Moderate hike or take the cable car from Rike Park. Uneven stone paths.',
    parking: false,
    difficulty: 'MEDIUM',
    status: 'APPROVED',
  },
  {
    title: 'Batumi Boulevard Palm Walk',
    description:
      'A long seaside promenade lined with palm trees, perfect for editorial and lifestyle shoots. Best light is early morning before the crowds, with the Black Sea and Alphabet Tower as a backdrop.',
    category: 'Beach',
    city: 'Batumi',
    lat: 41.6459,
    lng: 41.6339,
    tags: ['beach', 'palm-trees', 'seaside', 'lifestyle'],
    bestTime: 'Early morning or blue hour',
    accessibility: 'Fully paved, wheelchair accessible.',
    parking: true,
    difficulty: 'EASY',
    status: 'APPROVED',
  },
  {
    title: 'Gergeti Trinity Church at Dawn',
    description:
      'The legendary church beneath Mount Kazbek. Arrive before sunrise to catch the peak lit up in pink light with the church silhouetted below. A steady hike from Stepantsminda, roughly 1.5-2 hours.',
    category: 'Church',
    city: 'Kazbegi',
    lat: 42.6625,
    lng: 44.6199,
    tags: ['mountains', 'church', 'sunrise', 'hiking'],
    bestTime: 'Sunrise',
    accessibility: 'Steep hiking trail, ~6km round trip, or 4x4 taxi available in Stepantsminda.',
    parking: true,
    difficulty: 'HARD',
    status: 'APPROVED',
  },
  {
    title: 'Martvili Canyon Turquoise Pools',
    description:
      'Emerald-green canyon pools surrounded by lush forest, accessible via a wooden boardwalk and optional boat ride. Great for both portraits and nature photography.',
    category: 'Nature',
    city: 'Zugdidi',
    lat: 42.409,
    lng: 42.3833,
    tags: ['canyon', 'water', 'forest', 'hidden-gem'],
    bestTime: 'Midday for the best turquoise water color',
    accessibility: 'Boardwalk with stairs, moderate walking.',
    parking: true,
    difficulty: 'MEDIUM',
    status: 'APPROVED',
  },
  {
    title: 'Sighnaghi City Walls at Golden Hour',
    description:
      'Sighnaghi\'s medieval fortress walls overlook the Alazani Valley — dramatic views for golden hour portraits and couples shoots, with cobblestone streets nearby for a romantic backdrop.',
    category: 'Wedding Spot',
    city: 'Sighnaghi',
    lat: 41.6206,
    lng: 45.9181,
    tags: ['valley', 'romantic', 'walls', 'wedding'],
    bestTime: 'Golden hour',
    accessibility: 'Easy walk along paved streets.',
    parking: true,
    difficulty: 'EASY',
    status: 'APPROVED',
  },
  {
    title: 'Abandoned Sanatorium, Tskaltubo',
    description:
      'A hauntingly beautiful Soviet-era sanatorium with peeling paint, grand staircases, and overgrown courtyards. Popular for editorial, urbex, and moody portrait work. Respect the structure and go with a local guide.',
    category: 'Abandoned',
    city: 'Kutaisi',
    lat: 42.3308,
    lng: 42.6067,
    tags: ['urbex', 'abandoned', 'soviet', 'moody'],
    bestTime: 'Overcast days for even, moody light',
    accessibility: 'Uneven floors and debris — sturdy shoes required, some structural risk.',
    parking: true,
    difficulty: 'MEDIUM',
    status: 'APPROVED',
  },
  {
    title: 'Bakuriani Pine Forest Trail',
    description:
      'Snow-dusted pine forest right outside Bakuriani, magical for winter portraits and product shoots. In summer it turns into a lush green trail perfect for family sessions.',
    category: 'Forest',
    city: 'Bakuriani',
    lat: 41.7469,
    lng: 43.5257,
    tags: ['forest', 'snow', 'pine-trees', 'winter'],
    bestTime: 'Early morning, especially after fresh snowfall',
    accessibility: 'Flat forest trail, easy walking, can be slippery in winter.',
    parking: true,
    difficulty: 'EASY',
    status: 'APPROVED',
  },
  {
    title: 'Svaneti Towers of Mestia',
    description:
      'The iconic stone defensive towers of Svaneti with the Caucasus peaks in the background. A must for landscape and cultural photography.',
    category: 'Mountains',
    city: 'Mestia',
    lat: 43.0455,
    lng: 42.7284,
    tags: ['towers', 'unesco', 'mountains', 'caucasus'],
    bestTime: 'Clear mornings for unobstructed peak views',
    accessibility: 'Town center, easy walking. Surrounding hiking trails are harder.',
    parking: true,
    difficulty: 'EASY',
    status: 'APPROVED',
  },
  {
    title: 'Gudauri Ridge Drone Spot',
    description:
      'Sweeping panoramic views over the Georgian Military Highway switchbacks — one of the best drone photography spots in the Caucasus.',
    category: 'Drone Spot',
    city: 'Gudauri',
    lat: 42.4767,
    lng: 44.4766,
    tags: ['drone', 'mountains', 'panorama', 'road'],
    bestTime: 'Clear weather, midday for maximum visibility',
    accessibility: 'Roadside pull-off, minimal walking. Check drone regulations before flying.',
    parking: true,
    difficulty: 'EASY',
    status: 'APPROVED',
  },
  {
    title: 'Rustaveli Avenue Architecture Walk',
    description:
      'Tbilisi\'s grand central avenue, lined with 19th-century architecture, perfect for urban and street photography at night when the buildings are lit up.',
    category: 'Architecture',
    city: 'Tbilisi',
    lat: 41.6977,
    lng: 44.7981,
    tags: ['architecture', 'urban', 'night', 'street'],
    bestTime: 'Blue hour and after dark',
    accessibility: 'Fully paved, wheelchair accessible.',
    parking: false,
    difficulty: 'EASY',
    status: 'PENDING',
  },
  {
    title: 'Borjomi Central Park Waterfall',
    description:
      'A small but scenic waterfall inside Borjomi Central Park, surrounded by mineral water springs and forested hills.',
    category: 'Waterfalls',
    city: 'Borjomi',
    lat: 41.8419,
    lng: 43.3936,
    tags: ['waterfall', 'park', 'nature'],
    bestTime: 'Morning, avoids crowds',
    accessibility: 'Short paved walk from the park entrance.',
    parking: true,
    difficulty: 'EASY',
    status: 'PENDING',
  },
  {
    title: 'Random Backyard, Not a Real Spot',
    description: 'Test rejected listing used to demonstrate the moderation workflow in the admin dashboard.',
    category: 'Other',
    city: 'Rustavi',
    lat: 41.5495,
    lng: 45.0113,
    tags: ['test'],
    bestTime: '',
    accessibility: '',
    parking: false,
    difficulty: 'EASY',
    status: 'REJECTED',
    rejectionNote: 'This does not appear to be a genuine photography location. Please submit real scouted spots only.',
  },
];

async function main() {
  console.log('Seeding database...');

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      username: 'admin',
      fullName: 'PhotoSpot Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      bio: 'Platform administrator.',
    },
  });
  console.log(`Admin ready: ${admin.email} / ${ADMIN_PASSWORD}`);

  const demoPasswordHash = await bcrypt.hash('Demo1234!', 12);
  const users = [];
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        city: u.city,
        bio: u.bio,
        passwordHash: demoPasswordHash,
        role: 'USER',
        avatarUrl: picsum(`avatar-${u.username}`, 200, 200),
      },
    });
    users.push(user);
  }
  console.log(`${users.length} demo users ready (password: Demo1234!)`);

  let created = 0;
  for (let i = 0; i < LOCATIONS.length; i++) {
    const loc = LOCATIONS[i];
    const author = users[i % users.length];
    const slug = slugify(loc.title);

    const existing = await prisma.location.findUnique({ where: { slug } });
    if (existing) continue;

    await prisma.location.create({
      data: {
        slug,
        title: loc.title,
        description: loc.description,
        category: loc.category,
        city: loc.city,
        latitude: loc.lat,
        longitude: loc.lng,
        tags: JSON.stringify(loc.tags),
        bestTime: loc.bestTime || null,
        accessibility: loc.accessibility || null,
        parking: loc.parking,
        difficulty: loc.difficulty,
        status: loc.status,
        rejectionNote: (loc as any).rejectionNote ?? null,
        featured: i < 3,
        views: Math.floor(Math.random() * 500),
        authorId: author.id,
        reviewedById: loc.status !== 'PENDING' ? admin.id : null,
        reviewedAt: loc.status !== 'PENDING' ? new Date() : null,
        images: {
          create: [0, 1, 2].map((n) => ({
            url: picsum(`${slug}-${n}`),
            order: n,
            isCover: n === 0,
            width: 1200,
            height: 800,
          })),
        },
      },
    });
    created += 1;
  }
  console.log(`${created} demo locations created`);

  console.log('\nSeed complete. You can log in as:');
  console.log(`  Admin -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Demo user -> nino@example.com / Demo1234!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
