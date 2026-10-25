import { site } from '@/data/site';

/**
 * Central configuration for the editorial portfolio shell: copy, HUD data sources and
 * motion settings. Colours, type and spacing are CSS variables in app/globals.css.
 */
export const portfolioConfig = {
  hud: {
    /** IANA zone used for the live clock, and the label shown next to it. */
    timeZone: 'Asia/Kolkata',
    timeZoneLabel: 'IST',
    city: 'Nagpur',
    role: 'Full-stack & Systems Engineering',
    /** Shown only because it is true of my profile; set to null to hide. */
    status: site.availability.startsWith('Open') ? 'Open to work' : null,
  },
  weather: {
    /** Open-Meteo needs no API key. Only my city is queried; visitors' locations are never requested. */
    enabled: true,
    latitude: 21.1458,
    longitude: 79.0882,
    /** Re-use a reading for this long (per browser session) before fetching again. */
    cacheMinutes: 15,
    timeoutMs: 5000,
  },
  hero: {
    /** Small mono line above the headline. */
    kicker: `${site.name} — ${site.role}`,
    /** Editorial headline, one entry per controlled line break. */
    headline: ['I engineer', 'full-stack products'],
    /** The word rendered as inflated glass in the centrepiece. Keep it short (3–6 letters). */
    word: 'build',
    /** Closing line under the centrepiece. */
    closing: ['Down to the', 'storage engine.'],
    intro: site.description,
  },
  warp: {
    /** Statements that fly past in the warp tunnel, in order. Keep each to a few words. */
    statements: ['Think in systems', 'Ship the whole stack', 'Sweat the storage engine'],
    /** Star count; phones and reduced motion get a single static frame instead of a loop. */
    stars: 520,
  },
  stickers: {
    /** Entrance: first sticker's delay, extra delay per sticker, base drop length (seconds). */
    fall: { delay: 0.25, stagger: 0.13, duration: 1.15 },
    /** Horizontal sway after landing: travel range (px; each sticker gets 8–18) and base cycle (s). */
    sway: { min: 8, max: 18, duration: 7.2 },
    /** Vertical float after landing: lift (px) and base cycle (s). Cycles differ per sticker. */
    float: { lift: 9, duration: 4.8 },
    /** How many stickers phones show (the rest hide below 768px). */
    visible: { mobile: 4 },
  },
  dock: [
    { id: 'work', label: 'Work', href: '/#work' },
    { id: 'about', label: 'About', href: '/#about' },
    { id: 'contact', label: 'Contact', href: '/#contact' },
  ],
} as const;

export type DockItem = (typeof portfolioConfig.dock)[number];
