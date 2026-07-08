// anything with coordinates can be a stop
type Stop = { latitude: number | null; longitude: number | null };

export function buildRouteUrl(stops: Stop[]): string | null {
  const located = stops.filter((s) => s.latitude !== null && s.longitude !== null);
  if (located.length === 0) return null;

  const coord = (c: Stop) => `${c.latitude},${c.longitude}`;

  // destination = the LAST stop; everything before it = waypoints.
  // We omit `origin` so the maps app starts from the user's CURRENT location.
  const destination = coord(located[located.length - 1]);
  const middle = located.slice(0, -1).map(coord).join("|"); // all but the last

  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  if (middle) {
    url += `&waypoints=${encodeURIComponent(middle)}`;
  }
  return url;
}

export function buildAppleRouteUrl(stops: Stop[]): string | null {
  const located = stops.filter((s) => s.latitude !== null && s.longitude !== null);
  if (located.length === 0) return null;

  const dest = located[located.length - 1];
  const lat = Number(dest.latitude);
  const lng = Number(dest.longitude);
  return `https://maps.apple.com/?daddr=${lat}%2C${lng}&dirflg=d`;
}

export const MAX_RELIABLE_STOPS = 9;;

function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI / 180);
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function orderStopsByNearest<T extends { latitude: number | null; longitude: number | null}>(
    stops: T[]
): T[] {
    const located = stops.filter((s) => s.latitude !== null && s.longitude !== null);
    if (located.length <= 2) return located;

    const ordered: T[] = [];
    const remaining = [...located];

    let current = remaining.shift()!;
    ordered.push(current);

    while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDist = Infinity;

        for (let i = 0; i < remaining.length; i++) {
            const dist = haversineDistance(
                current.latitude as number, current.longitude as number,
                remaining[i].latitude as number, remaining[i].longitude as number
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIndex = i;
            }
        }

        current = remaining.splice(nearestIndex, 1)[0];
        ordered.push(current);
    }
    return ordered;
}