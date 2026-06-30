// anything with coordinates can be a stop
type Stop = { latitude: number | null; longitude: number | null };

export function buildRouteUrl(stops: Stop[]): string | null {
  const located = stops.filter((s) => s.latitude !== null && s.longitude !== null);
  if (located.length === 0) return null;

  const coord = (c: Stop) => `${c.latitude},${c.longitude}`;

  if (located.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coord(located[0])}`;
  }

  const origin = coord(located[0]);
  const destination = coord(located[located.length - 1]);
  const middle = located.slice(1, -1).map(coord).join("|");

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (middle) {
    url += `&waypoints=${encodeURIComponent(middle)}`;
  }
  return url;
}

export const MAX_RELIABLE_STOPS = 9;