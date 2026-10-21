# Govind Turkar — Portfolio

Personal site for **Govind Turkar**, software engineer. Full-stack products, down to the storage engine.

**Live:** [govind-turkar-portfolio.turkargovind3.chatgpt.site](https://govind-turkar-portfolio.turkargovind3.chatgpt.site)

## Featured work

| Project | What it is | Proof |
| --- | --- | --- |
| [ScratchDB](https://github.com/govindturkar69-crypto/database-from-scratch) | Relational database engine in safe Rust: 2Q buffer pool, B+Trees, SQL planner, strict 2PL, WAL + ARIES recovery | 58/58 release tests · 500K-transaction endurance runs |
| [VeriDoc](https://github.com/govindturkar69-crypto/VeriDoc) | Citation-grounded RAG with a relevance gate and honest refusal | 61-question evaluation incl. 8 unanswerable probes |
| [NexusCode](https://github.com/govindturkar69-crypto/NexusCode) | Kanban + Monaco IDE + WebSocket collaboration + Gemini assistance | React 19 · FastAPI · PostgreSQL |
| [RealtyIQ](https://github.com/govindturkar69-crypto/RealtyIQ) | Real-estate price prediction with confidence ranges and SHAP | Next.js · Express · FastAPI ML service |

Each project has a full case study at `/work/<slug>`.

## Architecture

```
app/
  layout.tsx            Root layout: metadata, JSON-LD, fonts, header, footer, ⌘K palette
  page.tsx              Home (Server Component) composing the sections
  work/[slug]/page.tsx  Statically generated case study per project
  sitemap.ts robots.ts not-found.tsx
components/
  descent/
    descent-controller.tsx  Client: GSAP/ScrollTrigger owner — scrubbed scene values, master depth timeline, gauge, sound
    ambient-sparkles.tsx    Sparse CSS-only stars behind the page (deterministic positions, no JS loop)
    sql-intro.tsx           Client: first-visit console intro (GSAP), skippable, once per session
    surface.tsx             Layer 00 hero, readable at --p: 0 without JavaScript
    mind-character.tsx      Client: original SVG character — eye tracking (atan2 + lerp on the GSAP ticker), blink, head tilt
    hero-timeline.tsx       Client: owns the hero scroll story — exploded-view head opening, glyph reveal, headline hand-off
    layer-scene.tsx         One pinned layer: copy, metrics, links and its visual
    layer-visuals.tsx       Five scroll-built visuals (workspace, request failover, SHAP, RAG gate, B+Tree/WAL)
  command-palette.tsx       Client: ⌘K / Ctrl+K / "/" palette on native <dialog> (combobox + listbox)
  copy-email-button.tsx     Client: clipboard copy with live-region feedback
  sections.tsx              Project index (bedrock), stack bento, about, contact, footer
  architecture-diagram.tsx, project-preview.tsx, stack-pills.tsx, site-header.tsx, ui.tsx, icons.tsx
data/
  projects.ts           Typed content for every project (problem, layers, challenges, metrics, links)
  descent.ts            Scroll order of the descent: which project lives at which layer
  site.ts stack.ts      Profile, navigation, experience, grouped stack with project evidence
  hero.ts               Hero copy, motion ranges and timing (colours: .hero-tokens in globals.css)
lib/clipboard.ts, lib/intro.ts (pre-paint intro decision script)
```

- **Content is data.** Edit `data/*.ts`; components never hard-code copy.
- **The descent.** Home is a scroll journey from the interface down to the disk. Each layer is a CSS-sticky scene; GSAP
  scrubs three values per scene (`--enter`, `--p`, `--leave`) and CSS derives the rest, so neighbouring layers cross-fade
  with depth (arriving layers grow out of the distance, departing ones swell past the camera). A master timeline over
  `#descent` drives `--depth` (backdrop tint) and the gauge readout. ScrollTrigger is used for progress only, never
  `pin`, so there are no pin-spacers fighting the sticky layout. All triggers live in one `useGSAP` context and
  `gsap.matchMedia()`, so route changes, breakpoints and Fast Refresh revert them without duplicates. Phones and `prefers-reduced-motion` get normal flowing sections with every visual fully built; a "Skip to the project index" link is always one click away.
- **Server first.** Scenes and copy are server-rendered; only the scroll controller, hero character/timeline, palette and copy button ship client JavaScript.
- **Motion** is CSS-first (GSAP + ScrollTrigger for the hero and the descent): 0.2–0.4 s ease-out transitions, scroll reveals via `animation-timeline: view()` (content stays visible where unsupported), and everything disabled under `prefers-reduced-motion`.
- **Accessibility:** semantic landmarks, skip link, visible focus rings, WCAG AA contrast on every token (ratios documented in `app/globals.css`), ≥12px text, new-tab links announced to screen readers.

### The hero character

`components/descent/mind-character.tsx` is an original SVG illustration (drawn from my own avatar's traits). Moving
parts are separate groups: head (tilt), eyes (blink), pupils (pointer tracking, elliptically clamped), three skull
layers, cut-surface outlines, guides, the glowing interior and ten emerging glyphs. As you scroll, the skull opens as
an engineering "exploded view": the layers lift apart with staggered counter-rotation while stack glyphs rise out on
individual curves, and the headline hands over to the reveal copy.

Customise:
- **Copy, motion ranges, timing:** `data/hero.ts` (`heroCopy`, `heroMotion`).
- **Colours:** `.hero-tokens` in `app/globals.css` (`--hero-*` background, `--mc-*` character).
- **Glyph positions:** `EMERGE` in `mind-character.tsx`; **sequence timing:** positions in `hero-timeline.tsx`.

Pointer state never touches React: pupils are lerped on the GSAP ticker, which removes itself once settled and only
runs while the character is on screen. Touch devices get occasional idle glances (no motion-sensor permissions).
Phones open the head as it scrolls through the viewport; reduced motion shows the finished, still composition.

### First-visit intro

A fictional console types one query and resolves the result into the hero (about 2.5 s; Esc, Enter, the Skip
button, a scroll or a touch exit in under half a second). It plays only on a fresh visit to `/` with no hash and no
reload, once per session, and never with `prefers-reduced-motion`. An inline `<head>` script makes that decision
before first paint, so the overlay never flashes in late. The hero heading is server-rendered underneath the whole
time; if hydration fails or is slower than 2.2 s, the overlay fades out by CSS, the intro is skipped, and scrolling is never locked. Purely visual:
no network or database calls.

### Adding real screenshots

Drop a 1600×1000 image in `public/projects/` and set `image` on the project in `data/projects.ts`:

```ts
image: { src: '/projects/nexuscode.webp', alt: 'NexusCode editor with Kanban board', width: 1600, height: 1000 },
```

Cards and case studies switch from the generated architecture preview to the screenshot automatically.

## Stack

Next.js 16 App Router on vinext (Vite) · React 19 · TypeScript · Tailwind CSS v4 · Cloudflare Workers · OpenAI Sites hosting

## Development

```bash
pnpm install
pnpm dev        # vinext dev server
pnpm lint
pnpm build
```
