export const site = {
  name: 'Govind Turkar',
  role: 'Software Engineer',
  /**
   * Public address used for canonical URLs, the sitemap and share cards (server-side only).
   * Set NEXT_PUBLIC_SITE_URL once you have a custom domain; on Vercel it otherwise defaults to
   * the project's production address, and to localhost in development.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  email: 'govindturkar69@gmail.com',
  location: 'Nagpur, India',
  resume: '/Govind_Turkar_Resume.pdf',
  github: 'https://github.com/govindturkar69-crypto',
  linkedin: 'https://www.linkedin.com/in/govind-turkar-1487a0430/',
  availability: 'Open to SWE roles · Graduating 2027',
  description:
    'Software engineer building full-stack products on React, TypeScript and typed APIs — and the systems underneath them, including a relational database engine written in Rust.',
} as const;

export type TimelineEntry = {
  kind: 'work' | 'education';
  period: string;
  title: string;
  organization: string;
  href: string;
  detail: string;
};

export const experience: TimelineEntry[] = [
  {
    kind: 'work',
    period: '2026 — Now',
    title: 'Full Stack Developer Intern · Remote',
    organization: 'KodeKalp Global Technologies',
    href: 'https://www.kodekalp.com/',
    detail:
      'Shipping full-stack features. Built Aurora Weather: a React interface on a typed Node/Express API with Redis cache-aside and automatic provider fallback.',
  },
  {
    kind: 'education',
    period: '2023 — 2027',
    title: 'B.Tech, Computer Science & Engineering',
    organization: 'G H Raisoni College of Engineering, Nagpur',
    href: 'https://ghrce.raisoni.net/about-ghrce',
    detail:
      'Final year, graduating 2027. Final-year projects: NexusCode and VeriDoc.',
  },
];
