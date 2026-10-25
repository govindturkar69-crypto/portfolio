# Govind Turkar — Portfolio

Personal site for **Govind Turkar**, software engineer. Full-stack products, down to the storage engine.

**Live:** [govind-turkar-portfolio.turkargovind3.chatgpt.site](https://govind-turkar-portfolio.turkargovind3.chatgpt.site)

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
  layout.tsx              Metadata, JSON-LD, theme + font scripts, HUD, footer, palette, cursor
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
  command-palette.tsx     ⌘K / Ctrl+K / "/" palette on a native <dialog>
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

Next.js 16 App Router on vinext (Vite) · React 19 · TypeScript · Tailwind CSS v4 · GSAP · Cloudflare Workers ·
OpenAI Sites hosting

## Development

```bash
pnpm install
pnpm dev        # vinext dev server
pnpm lint
pnpm build
```

`pnpm-workspace.yaml` still asks whether esbuild, sharp, unrs-resolver and workerd may run install scripts; answer
those (`pnpm approve-builds`) before `pnpm run build` will run. `npx vinext build` works in the meantime.
