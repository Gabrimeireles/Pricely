import { useEffect, useRef } from 'react';
import { MapPinIcon } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

export type StoreMapEstablishment = {
  id: string;
  brandName: string;
  unitName: string;
  neighborhood: string;
  distanceKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Props = {
  height?: number;
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  establishments: StoreMapEstablishment[];
};

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

export function StoreMap({ height = 360, center, radiusKm, establishments }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const storesWithCoords = establishments.filter(
        (s): s is StoreMapEstablishment & { latitude: number; longitude: number } =>
          typeof s.latitude === 'number' && typeof s.longitude === 'number',
      );

      // Compute zoom so the radius circle fits inside the container with ~10% padding.
      // At latitude 23° (Brazil): visible_km ≈ height * 40075 * cos(23°) / (256 * 2^Z)
      const zoomForRadius = (km: number, containerHeight: number) => {
        const visibleFactor = (containerHeight * 40075 * 0.917 * 0.9) / 256;
        return Math.min(18, Math.max(5, Math.floor(Math.log2(visibleFactor / (2 * km)))));
      };

      // Center on user location; fall back to store centroid if no GPS
      const storeCentroid: [number, number] | null = storesWithCoords.length > 0
        ? [
            storesWithCoords.reduce((s, e) => s + e.latitude, 0) / storesWithCoords.length,
            storesWithCoords.reduce((s, e) => s + e.longitude, 0) / storesWithCoords.length,
          ]
        : null;

      const initialCenter: [number, number] = center
        ? [center.lat, center.lng]
        : storeCentroid ?? [-15.77972, -47.92972]; // Brasília as geographic center of Brazil

      const containerHeight = containerRef.current?.clientHeight ?? height;
      const initialZoom = center ? zoomForRadius(radiusKm, containerHeight) : storeCentroid ? 12 : 5;

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // User location marker + radius circle
      if (center) {
        const userIcon = L.divIcon({
          html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:var(--color-primary,#1d6f5e);
            border:3px solid white;
            box-shadow:0 0 0 3px rgba(29,111,94,0.3);
          "></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([center.lat, center.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('Sua localização');

        L.circle([center.lat, center.lng], {
          radius: radiusKm * 1000,
          color: 'var(--color-primary,#1d6f5e)',
          fillColor: 'var(--color-primary,#1d6f5e)',
          fillOpacity: 0.06,
          weight: 2,
        }).addTo(map);
      }

      // Store markers
      storesWithCoords.forEach((store) => {
        const storeIcon = L.divIcon({
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:white;
            border:2px solid var(--color-primary,#1d6f5e);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.15);
            font-size:14px;
          ">🏪</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const distLabel = store.distanceKm != null ? `${store.distanceKm.toFixed(1)} km` : store.neighborhood;
        L.marker([store.latitude, store.longitude], { icon: storeIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:140px">
              <div style="font-weight:700;font-size:13px">${store.brandName}</div>
              <div style="color:#666;font-size:12px">${store.unitName}</div>
              <div style="color:#888;font-size:11px;margin-top:2px">📍 ${distLabel}</div>
            </div>
          `);
      });

      // When no user location: fit bounds to visible stores
      if (!center && storesWithCoords.length > 1) {
        const points: [number, number][] = storesWithCoords.map((s) => [s.latitude, s.longitude]);
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center?.lat, center?.lng, radiusKm, establishments]);

  if (establishments.length === 0 && !center) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground"
      >
        <MapPinIcon className="size-8 opacity-40" />
        <p className="text-[13.5px]">Adicione sua localização para ver as lojas no mapa</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="overflow-hidden rounded-2xl border border-border [&_.leaflet-container]:rounded-2xl"
    />
  );
}
