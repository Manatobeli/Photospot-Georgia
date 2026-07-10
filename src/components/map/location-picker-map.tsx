'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { selectedPinIcon } from '@/components/map/leaflet-icons';
import { GeocodeSearch, type GeocodeResult } from '@/components/map/geocode-search';
import { CITY_COORDINATES } from '@/lib/constants';

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = '360px',
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const center = latitude && longitude ? { lat: latitude, lng: longitude } : CITY_COORDINATES.Tbilisi;

  const tileUrl =
    mounted && resolvedTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  function handleSelect(result: GeocodeResult) {
    onChange(result.lat, result.lng);
    setFlyTarget({ lat: result.lat, lng: result.lng });
  }

  return (
    <div className="space-y-2">
      <GeocodeSearch onSelect={handleSelect} placeholder="Search for an address or place…" />
      <div className="overflow-hidden rounded-xl2 border border-neutral-200 dark:border-neutral-700" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={latitude ? 13 : 7}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
          className="cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url={tileUrl}
          />
          <ClickHandler onPick={onChange} />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          {latitude !== null && longitude !== null && (
            <Marker
              position={[latitude, longitude]}
              icon={selectedPinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target as L.Marker;
                  const pos = marker.getLatLng();
                  onChange(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Click anywhere on the map, search for a place, or drag the marker to fine-tune the exact spot.
        {latitude !== null && longitude !== null && (
          <span className="ml-1 font-mono text-neutral-600 dark:text-neutral-300">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        )}
      </p>
    </div>
  );
}
