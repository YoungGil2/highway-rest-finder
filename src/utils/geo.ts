import { RestStop } from "@/types";

const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const distanceToSegmentKm = (
  lat: number,
  lng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const dx = lat2 - lat1;
  const dy = lng2 - lng1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineKm(lat, lng, lat1, lng1);
  const t = Math.max(
    0,
    Math.min(1, ((lat - lat1) * dx + (lng - lng1) * dy) / lenSq),
  );
  return haversineKm(lat, lng, lat1 + t * dx, lng1 + t * dy);
};

export const isNearRoute = (
  stop: RestStop,
  polyline: [number, number][],
  thresholdKm = 5,
) => {
  for (let i = 0; i < polyline.length - 1; i++) {
    const [x1, y1] = polyline[i];
    const [x2, y2] = polyline[i + 1];
    if (distanceToSegmentKm(stop.lat, stop.lng, y1, x1, y2, x2) <= thresholdKm)
      return true;
  }
  return false;
};
