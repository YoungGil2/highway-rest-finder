'use client';

import { useEffect, useRef } from 'react';
import { RestStop, RouteOption } from '@/types';

type KakaoMapProps = {
  routes: RouteOption[];
  selectedIndex: number;
  restStops: RestStop[];
};

const KakaoMap = ({ routes, selectedIndex, restStops }: KakaoMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const polylinesRef = useRef<kakao.maps.Polyline[]>([]);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window === 'undefined' || !window.kakao) return;

    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(37.5665, 126.978);
      const map = new window.kakao.maps.Map(containerRef.current!, {
        center,
        level: 7,
      });
      mapRef.current = map;
    });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (routes.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    routes.forEach((route, idx) => {
      const isSelected = idx === selectedIndex;
      const path = route.polyline.map(([x, y]) => new window.kakao.maps.LatLng(y, x));

      const polyline = new window.kakao.maps.Polyline({
        path,
        strokeWeight: isSelected ? 6 : 4,
        strokeColor: isSelected ? '#3B82F6' : '#9CA3AF',
        strokeOpacity: isSelected ? 0.9 : 0.5,
        strokeStyle: 'solid',
      });
      polyline.setMap(map);
      polylinesRef.current.push(polyline);

      if (isSelected) {
        path.forEach((latlng) => bounds.extend(latlng));
        map.setBounds(bounds);
      }
    });
  }, [routes, selectedIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    restStops.forEach((stop) => {
      const position = new window.kakao.maps.LatLng(stop.lat, stop.lng);
      const marker = new window.kakao.maps.Marker({ position, map });

      const content = `
        <div style="padding:10px;min-width:150px;">
          <strong style="font-size:14px;">${stop.name}</strong>
          <div style="color:#666;font-size:12px;margin-top:4px;">${stop.routeName} ${stop.direction}</div>
          ${
            stop.facilities.length > 0
              ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
              ${stop.facilities
                .map(
                  (f) =>
                    `<span style="background:#EFF6FF;color:#2563EB;font-size:11px;padding:2px 6px;border-radius:9999px;">${f}</span>`,
                )
                .join('')}
            </div>`
              : ''
          }
        </div>
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({ content, removable: true });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindow.open(map, marker);
        infoWindowRef.current = infoWindow;
      });

      markersRef.current.push(marker);
    });
  }, [restStops]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default KakaoMap;
