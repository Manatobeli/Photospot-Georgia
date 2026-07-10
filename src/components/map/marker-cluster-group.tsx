'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { createClusterIcon } from '@/components/map/leaflet-icons';

export interface ClusterMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  icon: L.DivIcon;
  onClick?: () => void;
  popupHtml?: string;
}

/**
 * Imperative wrapper around leaflet.markercluster — react-leaflet has no
 * first-party clustering support, so this drives the plugin directly via
 * the map instance from useMap().
 */
export function MarkerClusterGroup({ markers }: { markers: ClusterMarkerData[] }) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      iconCreateFunction: (cluster) => createClusterIcon(cluster.getChildCount()),
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();

    markers.forEach((m) => {
      const marker = L.marker([m.latitude, m.longitude], { icon: m.icon });
      if (m.popupHtml) marker.bindPopup(m.popupHtml, { maxWidth: 280, minWidth: 240 });
      if (m.onClick) marker.on('click', m.onClick);
      group.addLayer(marker);
    });
  }, [markers]);

  return null;
}
