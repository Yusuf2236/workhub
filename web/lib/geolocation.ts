/**
 * WorkHub Geolocation Detection Utility
 * Detects the user's real city/district in Uzbekistan via browser Geolocation API
 * and reverse-geocodes with OpenStreetMap Nominatim or closest regional center fallback.
 */

interface GeoCity {
  name: string;
  lat: number;
  lon: number;
}

const UZBEK_REGIONS: GeoCity[] = [
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

/**
 * detectCurrentLocation: attempts to fetch GPS coordinates and returns
 * formatted city/district name in Uzbekistan.
 */
export async function detectCurrentLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve('Toshkent shahri');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            {
              signal: controller.signal,
              headers: { 'Accept-Language': 'uz,ru,en' },
            }
          );
          clearTimeout(timer);
          const data = await res.json();
          const addr = data.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.state ||
            addr.county ||
            getClosestUzbekRegion(latitude, longitude);
          const district = addr.suburb || addr.city_district || addr.neighbourhood || '';

          if (district && city && !district.toLowerCase().includes(city.toLowerCase())) {
            resolve(`${city}, ${district}`);
          } else {
            resolve(city || 'Toshkent shahri');
          }
        } catch {
          // Fallback by coordinates proximity in Uzbekistan
          resolve(getClosestUzbekRegion(latitude, longitude));
        }
      },
      (err) => {
        console.warn('Geolocation lookup notice:', err.message);
        resolve('Toshkent shahri');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}
