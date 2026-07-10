export const GEORGIA_CITIES = [
  'Tbilisi',
  'Batumi',
  'Kutaisi',
  'Rustavi',
  'Zugdidi',
  'Telavi',
  'Gori',
  'Borjomi',
  'Mtskheta',
  'Akhaltsikhe',
  'Poti',
  'Kobuleti',
  'Ozurgeti',
  'Mestia',
  'Ambrolauri',
  'Sighnaghi',
  'Kazbegi',
  'Gudauri',
  'Bakuriani',
  'Stepantsminda',
] as const;

export type GeorgiaCity = (typeof GEORGIA_CITIES)[number];

// Approximate center coordinates for each city — used as a fallback map
// center when filtering by city, and to seed demo data.
export const CITY_COORDINATES: Record<GeorgiaCity, { lat: number; lng: number }> = {
  Tbilisi: { lat: 41.7151, lng: 44.8271 },
  Batumi: { lat: 41.6168, lng: 41.6367 },
  Kutaisi: { lat: 42.2679, lng: 42.7 },
  Rustavi: { lat: 41.5495, lng: 45.0113 },
  Zugdidi: { lat: 42.5088, lng: 41.8709 },
  Telavi: { lat: 41.9165, lng: 45.4736 },
  Gori: { lat: 41.9847, lng: 44.1122 },
  Borjomi: { lat: 41.8406, lng: 43.3919 },
  Mtskheta: { lat: 41.8453, lng: 44.7208 },
  Akhaltsikhe: { lat: 41.6403, lng: 42.9857 },
  Poti: { lat: 42.1502, lng: 41.6714 },
  Kobuleti: { lat: 41.8172, lng: 41.7808 },
  Ozurgeti: { lat: 41.9247, lng: 42.0086 },
  Mestia: { lat: 43.0446, lng: 42.7278 },
  Ambrolauri: { lat: 42.5244, lng: 43.1478 },
  Sighnaghi: { lat: 41.6214, lng: 45.9186 },
  Kazbegi: { lat: 42.6578, lng: 44.6431 },
  Gudauri: { lat: 42.4753, lng: 44.4764 },
  Bakuriani: { lat: 41.7514, lng: 43.5286 },
  Stepantsminda: { lat: 42.6578, lng: 44.6431 },
};

export const CATEGORIES = [
  'Nature',
  'Mountains',
  'Forest',
  'Lakes',
  'Waterfalls',
  'Beach',
  'River',
  'Sunset',
  'Urban',
  'Street',
  'Architecture',
  'Abandoned',
  'Historical',
  'Castle',
  'Church',
  'Cafe',
  'Restaurant',
  'Hotel',
  'Hidden Gem',
  'Wedding Spot',
  'Portrait Spot',
  'Drone Spot',
  'Car Photography',
  'Night Photography',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 20, 50, 100] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CHANGES_REQUESTED: 'Changes Requested',
};

export const SITE_NAME = 'PhotoSpot Georgia';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
