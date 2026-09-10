/**
 * Metro Atlanta areas. Members choose an area as their private location; only
 * the `publicLabel` is ever shown to other members, and distances are computed
 * between area centroids (server-side), never from a device location.
 * Coordinates are approximate public centroids for each area.
 */
export interface Area {
  id: string;
  /** Short name for pickers, e.g. "Duluth". */
  name: string;
  /** What other members see, e.g. "Duluth area". */
  publicLabel: string;
  lat: number;
  lng: number;
}

export const AREAS: readonly Area[] = [
  { id: 'downtown-atlanta', name: 'Downtown Atlanta', publicLabel: 'Atlanta', lat: 33.749, lng: -84.388 },
  { id: 'midtown-atlanta', name: 'Midtown Atlanta', publicLabel: 'Midtown Atlanta', lat: 33.7838, lng: -84.383 },
  { id: 'buckhead', name: 'Buckhead', publicLabel: 'Buckhead', lat: 33.8384, lng: -84.3795 },
  { id: 'west-midtown', name: 'West Midtown', publicLabel: 'West Midtown', lat: 33.783, lng: -84.411 },
  { id: 'old-fourth-ward', name: 'Old Fourth Ward', publicLabel: 'Old Fourth Ward', lat: 33.764, lng: -84.369 },
  { id: 'inman-park', name: 'Inman Park', publicLabel: 'Inman Park', lat: 33.759, lng: -84.352 },
  { id: 'virginia-highland', name: 'Virginia-Highland', publicLabel: 'Virginia-Highland', lat: 33.781, lng: -84.354 },
  { id: 'east-atlanta', name: 'East Atlanta', publicLabel: 'East Atlanta', lat: 33.74, lng: -84.34 },
  { id: 'west-end', name: 'West End', publicLabel: 'West End', lat: 33.736, lng: -84.415 },
  { id: 'decatur', name: 'Decatur', publicLabel: 'Decatur', lat: 33.7748, lng: -84.2963 },
  { id: 'brookhaven', name: 'Brookhaven', publicLabel: 'Brookhaven', lat: 33.8651, lng: -84.3366 },
  { id: 'chamblee', name: 'Chamblee', publicLabel: 'Chamblee area', lat: 33.8921, lng: -84.2988 },
  { id: 'sandy-springs', name: 'Sandy Springs', publicLabel: 'Sandy Springs', lat: 33.9304, lng: -84.3733 },
  { id: 'dunwoody', name: 'Dunwoody', publicLabel: 'Dunwoody', lat: 33.9462, lng: -84.3346 },
  { id: 'smyrna', name: 'Smyrna', publicLabel: 'Smyrna area', lat: 33.884, lng: -84.5144 },
  { id: 'vinings', name: 'Vinings', publicLabel: 'Vinings', lat: 33.865, lng: -84.465 },
  { id: 'marietta', name: 'Marietta', publicLabel: 'Marietta area', lat: 33.9526, lng: -84.5499 },
  { id: 'kennesaw', name: 'Kennesaw', publicLabel: 'Kennesaw area', lat: 34.0234, lng: -84.6155 },
  { id: 'roswell', name: 'Roswell', publicLabel: 'Roswell area', lat: 34.0232, lng: -84.3616 },
  { id: 'alpharetta', name: 'Alpharetta', publicLabel: 'Alpharetta area', lat: 34.0754, lng: -84.2941 },
  { id: 'johns-creek', name: 'Johns Creek', publicLabel: 'Johns Creek area', lat: 34.0289, lng: -84.1986 },
  { id: 'duluth', name: 'Duluth', publicLabel: 'Duluth area', lat: 34.0029, lng: -84.1446 },
  { id: 'suwanee', name: 'Suwanee', publicLabel: 'Suwanee area', lat: 34.0515, lng: -84.0713 },
  { id: 'norcross', name: 'Norcross', publicLabel: 'Norcross area', lat: 33.9412, lng: -84.2135 },
  { id: 'lawrenceville', name: 'Lawrenceville', publicLabel: 'Lawrenceville area', lat: 33.9562, lng: -83.988 },
  { id: 'cumming', name: 'Cumming', publicLabel: 'Cumming area', lat: 34.2073, lng: -84.1402 },
  { id: 'woodstock', name: 'Woodstock', publicLabel: 'Woodstock area', lat: 34.1015, lng: -84.5194 },
  { id: 'stone-mountain', name: 'Stone Mountain', publicLabel: 'Stone Mountain area', lat: 33.8081, lng: -84.1702 },
  { id: 'college-park', name: 'College Park', publicLabel: 'College Park area', lat: 33.6534, lng: -84.4494 },
  { id: 'peachtree-city', name: 'Peachtree City', publicLabel: 'Peachtree City area', lat: 33.3968, lng: -84.5957 },
  { id: 'athens', name: 'Athens', publicLabel: 'Athens area', lat: 33.951, lng: -83.3576 },
];

const BY_ID = new Map(AREAS.map((a) => [a.id, a]));

export function areaById(id: string | null | undefined): Area | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function areaPublicLabel(id: string | null | undefined): string {
  return areaById(id)?.publicLabel ?? 'Metro Atlanta';
}

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Whole miles between two areas, or null when either area is unknown. */
export function areaDistanceMiles(fromId: string | null | undefined, toId: string | null | undefined): number | null {
  const a = areaById(fromId);
  const b = areaById(toId);
  if (!a || !b) return null;
  return Math.round(haversineMiles(a, b));
}

export const DISTANCE_OPTIONS_MILES: readonly number[] = [5, 10, 15, 25, 40, 60, 100];
export const DEFAULT_MAX_DISTANCE_MILES = 25;
