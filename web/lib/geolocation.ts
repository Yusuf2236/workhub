/**
 * WorkHub Geolocation Detection Utility
 * Accurately detects user's real city/district/region in Uzbekistan via:
 * 1. Browser Geolocation API -> BigDataCloud reverse geocoding (native Uzbek locale)
 * 2. Nominatim OpenStreetMap fallback
 * 3. Proximity-based regional calculation in Uzbekistan
 * 4. High-accuracy IP-based fallback (ipwho.is)
 */

interface GeoCity {
  name: string;
  lat: number;
  lon: number;
}

export const UZBEK_REGIONS: GeoCity[] = [
  { name: 'Toshkent shahri', lat: 41.2995, lon: 69.2401 },
  { name: 'Toshkent viloyati', lat: 41.1667, lon: 69.5 },
  { name: 'Samarqand viloyati', lat: 39.627, lon: 66.975 },
  { name: 'Buxoro viloyati', lat: 39.7681, lon: 64.4556 },
  { name: 'Andijon viloyati', lat: 40.7821, lon: 72.3442 },
  { name: 'Farg‘ona viloyati', lat: 40.3864, lon: 71.7864 },
  { name: 'Namangan viloyati', lat: 40.9983, lon: 71.6726 },
  { name: 'Qashqadaryo viloyati', lat: 38.8606, lon: 65.789 },
  { name: 'Surxondaryo viloyati', lat: 37.2242, lon: 67.2783 },
  { name: 'Navoiy viloyati', lat: 40.0844, lon: 65.3792 },
  { name: 'Xorazm viloyati', lat: 41.5504, lon: 60.6315 },
  { name: 'Qoraqalpog‘iston Respublikasi', lat: 42.4619, lon: 59.6166 },
  { name: 'Jizzax viloyati', lat: 40.1158, lon: 67.8422 },
  { name: 'Sirdaryo viloyati', lat: 40.4897, lon: 68.7847 },
];

export const ALL_UZBEK_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand viloyati',
  'Farg‘ona viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Xorazm viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Navoiy viloyati',
  'Qoraqalpog‘iston Respublikasi',
  'Masofaviy (Remote)',
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getClosestUzbekRegion(lat: number, lon: number): string {
  let closest = UZBEK_REGIONS[0];
  let minDistance = Infinity;

  for (const region of UZBEK_REGIONS) {
    const dist = getDistanceKm(lat, lon, region.lat, region.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = region;
    }
  }
  return closest.name;
}

async function reverseGeocodeCoords(lat: number, lon: number): Promise<string> {
  // 1. Try BigDataCloud (works in browser, no CORS issues, native Uzbek names)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=uz`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const subdivision = data.principalSubdivision || '';
      const city = data.city || data.locality || '';
      if (subdivision && city && !subdivision.toLowerCase().includes(city.toLowerCase())) {
        return `${subdivision}, ${city}`;
      }
      if (subdivision) return subdivision;
      if (city) return city;
    }
  } catch (_) {}

  // 2. Try Nominatim OpenStreetMap
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      { signal: controller.signal, headers: { 'Accept-Language': 'uz,ru,en' } }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.state || addr.county || '';
      const district = addr.suburb || addr.city_district || addr.neighbourhood || '';
      if (district && city && !district.toLowerCase().includes(city.toLowerCase())) {
        return `${city}, ${district}`;
      }
      if (city) return city;
    }
  } catch (_) {}

  // 3. Fallback to closest region center
  return getClosestUzbekRegion(lat, lon);
}

async function fetchIPLocation(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          return reverseGeocodeCoords(data.latitude, data.longitude);
        }
        if (data.region || data.city) {
          return data.region ? `${data.region}${data.city && data.city !== data.region ? ', ' + data.city : ''}` : data.city;
        }
      }
    }
  } catch (_) {}
  return null;
}

/**
 * detectCurrentLocation: attempts to fetch GPS coordinates and returns
 * formatted city/district name in Uzbekistan.
 */
export async function detectCurrentLocation(preferredFallback?: string): Promise<string> {
  if (typeof window === 'undefined') {
    return preferredFallback || 'Toshkent shahri';
  }

  // Check if browser supports geolocation
  if (navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          enableHighAccuracy: true,
          maximumAge: 300000,
        });
      });
      const locationName = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
      if (locationName) return locationName;
    } catch (e) {
      // GPS permission denied or timed out
    }
  }

  // Fallback 1: IP Geolocation
  const ipLoc = await fetchIPLocation();
  if (ipLoc) return ipLoc;

  // Fallback 2: preferred fallback or default
  return preferredFallback || 'Toshkent shahri';
}
