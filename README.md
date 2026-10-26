# Govind Turkar — Portfolio

Personal site for **Govind Turkar**, software engineer. Full-stack products, down to the storage engine.

**Live:** [portfolio-two-tawny-7n56aqfw0b.vercel.app](https://portfolio-two-tawny-7n56aqfw0b.vercel.app)

Hosted on **Vercel**: every push to `main` deploys automatically.

## Featured work

| Project | What it is |
| --- | --- |
| [ScratchDB](https://github.com/govindturkar69-crypto/database-from-scratch) | Relational database engine in safe Rust: buffer pool, B+Trees, SQL planner, strict 2PL, WAL + ARIES recovery |
| [Redis in Java](https://github.com/govindturkar69-crypto/build-your-own-redis-in-java) | Redis-compatible server in plain Java 21: RESP, NIO, lock striping, skip-list sorted sets, AOF + snapshots |
| [VeriDoc](https://github.com/govindturkar69-crypto/VeriDoc) | Citation-grounded RAG with a relevance gate and honest refusal |
| [Private Search Engine](https://github.com/govindturkar69-crypto/Private-Search-Engine) | Self-hosted search: SSRF-hardened crawler, SQLite inverted index, BM25, React UI |
| [NexusCode](https://github.com/govindturkar69-crypto/NexusCode) | Planning board, browser IDE, live collaboration and AI assistance |
| [RealtyIQ](https://github.com/govindturkar69-crypto/RealtyIQ) | Real-estate price prediction with confidence ranges and SHAP explanations |

Each project has a case study at `/work/<slug>`.

## Structure

```
app/
  layout.tsx              Metadata, JSON-LD, theme + font scripts, HUD, footer, cursor
  page.tsx                Home: hero, intro, work, capabilities, about, warp
  work/[slug]/page.tsx    Statically generated case study per project
  globals.css             Design tokens (paper/ink), and all component styles
  sitemap.ts robots.ts not-found.tsx
components/
  portfolio/
    hero.tsx                Editorial hero; inflated-word.tsx renders the WebGL glass word
    hero-stickers.tsx       Falling + floating stickers (hero band and section stickers); art in sticker-art.tsx
    home-sections.tsx       Intro, Work, Capabilities and About sections
    work-grid.tsx           Featured cards, compact rows and the project overlay; covers in project-cover.tsx
    warp-tunnel.tsx         Scroll-linked starfield with the three statements
    portfolio-hud.tsx       Fixed HUD: brand, clock, weather, pointer readout and hud-nav.tsx
    site-footer.tsx         Contact section and footer (every page)
    scroll-reveal.tsx       One IntersectionObserver that reveals elements once
    custom-cursor.tsx       Directional cursor with magnetic snapping (fine pointers only)
  architecture-diagram.tsx copy-email-button.tsx icons.tsx ui.tsx
data/                     projects.ts, site.ts, stack.ts — all content lives here
lib/                      portfolio-config.ts (copy + motion settings), theme.ts, sound.ts, clipboard.ts
```

- **Content is data.** Edit `data/*.ts` and `lib/portfolio-config.ts`; components never hard-code copy.
- **Themes.** Paper (light) and Ink (dark) share one layout; colours are CSS tokens in `app/globals.css`. A saved
  choice wins, otherwise the system preference; it is applied in `<head>` before first paint.
- **Stickers.** Pure CSS, four nested layers so no animations fight: fall, horizontal sway, vertical float, hover.
  Tune them in `portfolioConfig.stickers`. Reduced motion shows them settled and still.
- **Accessibility.** Semantic landmarks, skip link, visible focus, WCAG AA contrast on every token (ratios in
  `globals.css`), label-in-name controls, and `prefers-reduced-motion` respected everywhere.

### Project screenshots

Put an image in `public/projects/` and set `image` on the project in `data/projects.ts`; cards, the overlay and the
case study switch from the illustrated cover to the screenshot:

```ts
image: { src: '/projects/nexuscode.png', alt: 'NexusCode editor with Kanban board', width: 1600, height: 1000 },
```

Only add live links that work, and set `liveNote` if a host may need waking.

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · GSAP · Vercel

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
