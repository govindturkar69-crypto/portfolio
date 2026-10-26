import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { CustomCursor } from '@/components/portfolio/custom-cursor';
import { ScrollReveal } from '@/components/portfolio/scroll-reveal';
import { PortfolioHUD } from '@/components/portfolio/portfolio-hud';
import { SiteFooter } from '@/components/portfolio/site-footer';
import { site } from '@/data/site';
import { THEME_COLORS, themeScript } from '@/lib/theme';
import './globals.css';

const title = `${site.name} — Full-Stack Software Engineer`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s · ${site.name}` },
  description: site.description,
  keywords: [site.name, 'Software Engineer', 'Full-Stack Developer', 'Rust', 'Database Internals', 'React', 'TypeScript', 'FastAPI'],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description: site.description,
    url: '/',
    siteName: site.name,
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
  },
  twitter: { card: 'summary_large_image', title, description: site.description, images: ['/og.png'] },
  robots: { index: true, follow: true },
  // Set GOOGLE_SITE_VERIFICATION in Vercel to the token Search Console gives you (HTML tag method).
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS.light,
  colorScheme: 'light dark',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${site.url}/#person`,
  name: site.name,
  url: site.url,
  email: `mailto:${site.email}`,
  jobTitle: site.role,
  address: { '@type': 'PostalAddress', addressLocality: 'Nagpur', addressCountry: 'IN' },
  sameAs: [site.github, site.linkedin],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'G H Raisoni College of Engineering, Nagpur' },
  knowsAbout: ['Full-stack development', 'Database internals', 'Rust', 'TypeScript', 'React', 'Retrieval-augmented generation'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: `${site.name} — Portfolio`,
  description: site.description,
  inLanguage: 'en',
  author: { '@id': `${site.url}/#person` },
};

const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=TikTok+Sans:wght@300..900&family=Geist+Mono:wght@400..600&display=swap';
const fontLoaderScript = `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(FONTS_CSS)};document.head.appendChild(l)})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme (or the system preference) before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/*
          Web fonts must not block first paint: the stylesheet is preloaded, then attached by a
          tiny script (script-inserted stylesheets are not render-blocking). Text shows in the
          fallback font first and swaps in (display=swap). <noscript> keeps fonts without JS.
        */}
        <link rel="preload" as="style" href={FONTS_CSS} />
        <script dangerouslySetInnerHTML={{ __html: fontLoaderScript }} />
        <noscript>
          <link rel="stylesheet" href={FONTS_CSS} />
        </noscript>
      </head>
      <body className="min-h-dvh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        <PortfolioHUD />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <div aria-hidden="true" className="film-grain" />
        <CustomCursor />
        <ScrollReveal />
      </body>
    </html>
  );
}
