import type { Metadata, Viewport } from 'next';
import './globals.css';
import {
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_EN,
  SITE_DESCRIPTION_RU,
  SITE_DESCRIPTION_UZ,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TITLE,
  SITE_URL,
  keywordsMetaString,
} from '../lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'employment',
  classification: 'Job Board, Career, Vacancies, Resume, Recruitment',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'uz-UZ': '/',
      'ru-RU': '/',
      'en-US': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    alternateLocale: ['ru_RU', 'en_US'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ish, vakansiya, rezyume, karyera | Work Zone`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
    creator: '@WZoneUzBot',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
    shortcut: ['/icon'],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    // Google Search Console verification kodini keyin shu yerga qo'ying:
    // google: 'YOUR_GOOGLE_SITE_VERIFICATION',
  },
  other: {
    'geo.region': 'UZ',
    'geo.placename': 'Uzbekistan',
    'content-language': 'uz,ru,en',
    subject:
      'ish, vakansiya, job, work, career, resume, interview, recruitment, Work Zone',
    topic: 'Jobs, Vacancies, Career, Resume, Interview, Hiring Uzbekistan',
    abstract: SITE_DESCRIPTION,
    summary: SITE_DESCRIPTION_UZ,
    'og:description:uz': SITE_DESCRIPTION_UZ,
    'og:description:ru': SITE_DESCRIPTION_RU,
    'og:description:en': SITE_DESCRIPTION_EN,
    keywords: keywordsMetaString(),
    news_keywords: keywordsMetaString([
      'ish topish',
      'vakansiya',
      'работа',
      'вакансии',
      'jobs',
      'career',
    ]),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  legalName: 'WZone',
  alternateName: [
    'Work Zone',
    'WorkZone',
    'Work Zona',
    'WZone.uz',
    'Ish zona',
  ],
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description: SITE_DESCRIPTION,
  foundingDate: '2026',
  knowsLanguage: ['uz', 'ru', 'en'],
  areaServed: {
    '@type': 'Country',
    name: 'Uzbekistan',
  },
  sameAs: [
    'https://t.me/WZoneUzBot',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Uzbek', 'Russian', 'English'],
      url: SITE_URL,
    },
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: ['Work Zone', 'WorkZone', 'Work Zona'],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: ['uz-UZ', 'ru-RU', 'en-US'],
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const jobBoardJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  alternateName: ['Work Zone', 'Job Board Uzbekistan'],
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: ['uz', 'ru', 'en'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'UZS',
  },
  provider: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <script src="https://accounts.google.com/gsi/client" async defer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobBoardJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('workhub_theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
