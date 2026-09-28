import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/job/', '/opengraph-image', '/manifest.webmanifest'],
        disallow: [
          '/api/',
          '/auth/',
          '/admin',
          '/private',
          '/*?*token=',
          '/*?*access_token=',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/job/'],
        disallow: ['/api/', '/auth/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/job/'],
        disallow: ['/api/', '/auth/'],
      },
      {
        userAgent: 'Yandex',
        allow: ['/', '/job/'],
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
