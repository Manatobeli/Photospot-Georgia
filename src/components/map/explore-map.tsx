'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { MarkerClusterGroup, type ClusterMarkerData } from '@/components/map/marker-cluster-group';
import { LocateControl, FullscreenControl } from '@/components/map/map-controls';
import { createPinIcon } from '@/components/map/leaflet-icons';
import { CITY_COORDINATES } from '@/lib/constants';

export interface MapLocationPoint {
  id: string;
  slug: string;
  title: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  likesCount: number;
  commentsCount: number;
}

export interface FlySignal {
  lat: number;
  lng: number;
  zoom?: number;
  token: number; // increment to force effect re-run even if coords repeat
}

const CATEGORY_COLORS: Record<string, string> = {
  Nature: '#16a34a',
  Mountains: '#7c3aed',
  Lakes: '#0891b2',
  Waterfalls: '#0ea5e9',
  Beach: '#f59e0b',
  Urban: '#64748b',
  Historical: '#b45309',
  Castle: '#9333ea',
  Church: '#be185d',
  'Hidden Gem': '#ea580c',
};

function defaultColorFor(category: string) {
  return CATEGORY_COLORS[category] ?? '#ea580c';
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function popupHtml(loc: MapLocationPoint) {
  const img = loc.coverImage
    ? `<img src="${escapeHtml(loc.coverImage)}" alt="" style="width:100%;height:130px;object-fit:cover" />`
    : `<div style="width:100%;height:130px;background:#f1f5f9"></div>`;
  return `
    <a href="/locations/${escapeHtml(loc.slug)}" style="display:block;text-decoration:none;color:inherit;font-family:inherit">
      ${img}
      <div style="padding:10px 12px">
        <div style="font-weight:700;font-size:13.5px;margin-bottom:2px;color:#111827">${escapeHtml(loc.title)}</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${escapeHtml(loc.city)} &middot; ${escapeHtml(loc.category)}</div>
        <div style="display:flex;gap:10px;font-size:12px;color:#6b7280">
          <span>&#9825; ${loc.likesCount}</span>
          <span>&#128172; ${loc.commentsCount}</span>
        </div>
      </div>
    </a>`;
}

function FlyToHandler({ signal }: { signal?: FlySignal }) {
  const map = useMap();
  useEffect(() => {
    if (!signal) return;
    map.flyTo([signal.lat, signal.lng], signal.zoom ?? 12, { duration: 1 });
  }, [signal, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function ExploreMap({
  locations,
  center = CITY_COORDINATES.Tbilisi,
  zoom = 7,
  height = '100%',
  flySignal,
  radiusSelection,
  pickMode = false,
  onPick,
  className = '',
}: {
  locations: MapLocationPoint[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  flySignal?: FlySignal;
  radiusSelection?: { lat: number; lng: number; radiusKm: number } | null;
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const markers: ClusterMarkerData[] = useMemo(
    () =>
      locations.map((loc) => ({
        id: loc.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        icon: createPinIcon(defaultColorFor(loc.category)),
        popupHtml: popupHtml(loc),
      })),
    [locations]
  );

  const tileUrl =
    mounted && resolvedTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        className={pickMode ? 'cursor-crosshair' : ''}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        <MarkerClusterGroup markers={markers} />
        <FlyToHandler signal={flySignal} />
        {pickMode && <ClickHandler onPick={onPick} />}
        {radiusSelection && (
          <>
            <Circle
              center={[radiusSelection.lat, radiusSelection.lng]}
              radius={radiusSelection.radiusKm * 1000}
              pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.08, weight: 2 }}
            />
          </>
        )}
        <div className="leaflet-top leaflet-right" style={{ marginTop: 12, marginRight: 12 }}>
          <div className="leaflet-control flex flex-col gap-2">
            <LocateControl />
            <FullscreenControl containerRef={containerRef} />
          </div>
        </div>
      </MapContainer>
    </div>
  );
}
