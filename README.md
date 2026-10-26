# Govind Turkar — Portfolio

Personal site for **Govind Turkar**, software engineer. Full-stack products, down to the storage engine.

**Live:** [portfolio-two-tawny-7n56aqfw0b.vercel.app](https://portfolio-two-tawny-7n56aqfw0b.vercel.app)

Hosted on **Vercel**: every push to `main` deploys automatically.

## What's on the site

- **Hero** — a WebGL glass word, résumé download, copy-email button, and an availability indicator with direct
  GitHub, LinkedIn and Contact links.
- **In short** — the opening statement beside an animated system orbit (glass core, orbits, services lit in turn).
- **Work** — beside the heading, a layered architecture view built from each project's real layers (it cycles
  through the featured projects and follows the card you hover or focus); then featured project cards with
  category, stack, an architecture line and Case study / Source / Live demo links; the rest as compact rows. Each project opens in an overlay
  (`#project/<slug>` deep links) and has a full case study at `/work/<slug>`.
- **Capabilities, About, Contact** — a living code lattice (a turning geodesic wireframe with data moving across
  it, nodes labelled with the capability groups), principles, milestones, timeline, and a contact footer.
- **Navigation** — a fixed HUD with Work / About / Contact links, theme and sound toggles, and a résumé download.
- **Floating stickers** — technology stickers fall in from above, then drift within bounded areas across the page.

## Projects

| Project | What it is | Live |
| --- | --- | --- |
| [ScratchDB](https://github.com/govindturkar69-crypto/database-from-scratch) | Relational database engine in safe Rust: buffer pool, B+Trees, SQL planner, strict 2PL, WAL + ARIES recovery | — |
| [Redis in Java](https://github.com/govindturkar69-crypto/build-your-own-redis-in-java) | Redis-compatible server in plain Java 21: RESP, NIO, lock striping, skip-list sorted sets, AOF + snapshots | — |
| [VeriDoc](https://github.com/govindturkar69-crypto/VeriDoc) | Citation-grounded RAG with a relevance gate and honest refusal | [App](https://veridoc-9td5zj9kteg5cly2vnaz6b.streamlit.app/) |
| [Private Search Engine](https://github.com/govindturkar69-crypto/Private-Search-Engine) | Self-hosted search: SSRF-hardened crawler, SQLite inverted index, BM25, React UI | — |
| [NexusCode](https://github.com/govindturkar69-crypto/NexusCode) | Planning board, browser IDE, live collaboration and AI assistance | [App](https://nexus-code-chi.vercel.app) |
| [RealtyIQ](https://github.com/govindturkar69-crypto/RealtyIQ) | Real-estate price prediction with confidence ranges and SHAP explanations | [App](https://realty-iq-puce.vercel.app) |
| [Aurora Weather](https://github.com/govindturkar69-crypto/aurora-weather) | Typed weather API with automatic provider fallback and Redis cache-aside | [App](https://aurora-weather-six.vercel.app) |
| [TalentAI](https://github.com/govindturkar69-crypto/TalentAI-Recruitment-Platform) | Resume parsing, skill extraction and weighted candidate ranking for recruiters | — |

## Structure

```
app/
  layout.tsx              Metadata, JSON-LD, theme + font scripts, HUD, footer, cursor
  page.tsx                Home: hero, intro, work, capabilities, about, warp
  work/[slug]/page.tsx    Statically generated case study per project (with JSON-LD)
  globals.css             Design tokens (paper/ink), and all component styles
  sitemap.ts robots.ts not-found.tsx
components/
  portfolio/
    hero.tsx                Editorial hero, availability + profile links; inflated-word.tsx renders the WebGL word
    sticker-field.tsx       Page-wide floating sticker layer; art in sticker-art.tsx
    home-sections.tsx       Intro, Work, Capabilities and About sections
    work-grid.tsx           Featured cards, compact rows and the project overlay; covers in project-cover.tsx
    system-orbit.tsx        In short: system orbit
    system-architecture.tsx Work: layered architecture of the hovered / featured project (lib/project-focus.ts)
    dev-universe.tsx        About: living code lattice
    scene.ts                Shared canvas 3D helpers: projection, theme palette, DPR sizing, on-screen-only loop,
                            reduced motion
    warp-tunnel.tsx         Scroll-linked starfield with the three statements
    portfolio-hud.tsx       Fixed HUD: brand, clock, weather, pointer readout and hud-nav.tsx
    site-footer.tsx         Contact section and footer (every page)
    scroll-reveal.tsx       One IntersectionObserver that reveals elements once
    custom-cursor.tsx       Directional cursor with magnetic snapping (fine pointers only)
  architecture-diagram.tsx copy-email-button.tsx icons.tsx ui.tsx
data/                     projects.ts, site.ts, stack.ts — all content lives here
lib/                      portfolio-config.ts (copy + motion settings), theme.ts, sound.ts, clipboard.ts,
                          project-focus.ts
public/                   Résumé PDF, project screenshots, OG image, favicon
```

- **Content is data.** Edit `data/*.ts` and `lib/portfolio-config.ts`; components never hard-code copy.
- **Themes.** Paper (light) and Ink (dark) share one layout; colours are CSS tokens in `app/globals.css`. A saved
  choice wins, otherwise the system preference; it is applied in `<head>` before first paint.
- **Stickers.** A fixed layer behind the content: each sticker falls in, then wanders on a seeded (deterministic)
  path, eases away from the cursor and fades while it passes behind text. Tune counts and timing in
  `portfolioConfig.stickers.field`. Phones get fewer, smaller stickers; reduced motion shows them still.
- **3D scenes.** Transparent canvases (no frames; edges fade into the page) with a small perspective projection
  and one shared palette per theme (no 3D library). They start after load +
  idle, animate only while on screen, and draw a single still frame under reduced motion.
- **Accessibility.** Semantic landmarks, skip link, visible focus, WCAG AA contrast on every token, label-in-name
  controls, and `prefers-reduced-motion` respected everywhere.

### Project screenshots

Put an image in `public/projects/` and set `image` on the project in `data/projects.ts`; cards, the overlay and the
case study switch from the illustrated cover to the screenshot:

```ts
image: { src: '/projects/nexuscode.png', alt: 'NexusCode editor with Kanban board', width: 1600, height: 1000 },
```

Only add live links that work, and set `liveNote` if a host may need waking.

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · GSAP · WebGL · Vercel

## Development

```bash
pnpm install
pnpm dev        # Next.js dev server on http://localhost:3000
pnpm lint
pnpm build      # static production build
```

## Deployment

Import this GitHub repository in Vercel (framework preset: Next.js, defaults are fine). Canonical URLs, the sitemap
and share cards use Vercel's production address automatically; once you add a custom domain, set
`NEXT_PUBLIC_SITE_URL` (for example `https://yourname.dev`) in the Vercel project's environment variables.

### Google Search Console

1. In [Search Console](https://search.google.com/search-console), add a **URL-prefix** property for the live address.
2. Choose the **HTML tag** method and copy only the token from `content="…"`.
3. In Vercel → Settings → Environment Variables, add `GOOGLE_SITE_VERIFICATION` with that token, then redeploy.
4. Click **Verify** in Search Console, then submit `sitemap.xml` under **Sitemaps**.
5. Use **URL inspection** → **Request indexing** for the home page and each `/work/<slug>` page.

Indexing usually takes days, and no setup guarantees a ranking.
