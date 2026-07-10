import L from 'leaflet';

// Leaflet's default marker icon references image files that don't resolve
// correctly when bundled by Next.js/Webpack, so we ship a custom branded SVG
// pin instead of trying to patch the default asset URLs.

function pinSvg(color: string) {
  return `
    <svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.6 26.4 0 17 0z" fill="${color}"/>
      <circle cx="17" cy="17" r="7" fill="white"/>
    </svg>`;
}

export function createPinIcon(color = '#ea580c') {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: pinSvg(color),
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -42],
  });
}

export const defaultPinIcon = createPinIcon('#ea580c');
export const selectedPinIcon = createPinIcon('#0d9488');

export function createClusterIcon(count: number) {
  const size = count < 10 ? 36 : count < 50 ? 44 : 54;
  return L.divIcon({
    html: `<div class="marker-cluster-custom" style="width:${size}px;height:${size}px;font-size:${size < 44 ? 12 : 14}px">${count}</div>`,
    className: '',
    iconSize: [size, size],
  });
}
