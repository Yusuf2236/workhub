import { headers } from 'next/headers';

// Server-side helpers for pages rendered on the Next.js server (SEO pages, sitemap).

const BACKEND = `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:8080'}/api/v1`;

/** backendGet fetches an API route from the server; it returns null on any failure. */
export async function backendGet<T>(path: string, revalidateSeconds = 300): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}${path}`, { next: { revalidate: revalidateSeconds } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as T) : null;
  } catch {
    return null;
  }
}

/** siteUrl is the public address: PUBLIC_SITE_URL, or the host the request came to. */
export function siteUrl(): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
