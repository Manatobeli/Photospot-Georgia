import type { Metadata } from 'next';
import { DashboardLocationsClient } from './dashboard-locations-client';

export const metadata: Metadata = { title: 'My Locations' };

export default function DashboardLocationsPage() {
  return <DashboardLocationsClient />;
}
