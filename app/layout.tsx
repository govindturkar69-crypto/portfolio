import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { CommandPalette } from '@/components/command-palette';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/sections';
import { site } from '@/data/site';
import { introDecisionScript } from '@/lib/intro';
import './globals.css';

const title = `${site.name} — ${site.role}`;

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
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: site.url,
  email: `mailto:${site.email}`,
  jobTitle: site.role,
  address: { '@type': 'PostalAddress', addressLocality: 'Nagpur', addressCountry: 'IN' },
  sameAs: [site.github, site.linkedin],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'G H Raisoni College of Engineering, Nagpur' },
  knowsAbout: ['Full-stack development', 'Database internals', 'Rust', 'TypeScript', 'React', 'Retrieval-augmented generation'],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Decides before first paint whether the first-visit intro plays (sets <html data-intro>). */}
        <script dangerouslySetInnerHTML={{ __html: introDecisionScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* App Router root layout applies to every route; this rule targets pages/_document. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body className="min-h-dvh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <CommandPalette />
        <div aria-hidden="true" className="film-grain" />
      </body>
    </html>
  );
}
