import { Hero } from '@/components/portfolio/hero';
import { AboutSection, CapabilitiesSection, IntroSection, WorkSection } from '@/components/portfolio/home-sections';
import dynamic from 'next/dynamic';

// Decorative or below-the-fold client code loads in its own chunks (still server-rendered),
// so it never competes with the hero for the main thread on first load.
const StickerField = dynamic(() => import('@/components/portfolio/sticker-field').then((m) => m.StickerField));
const WarpTunnel = dynamic(() => import('@/components/portfolio/warp-tunnel').then((m) => m.WarpTunnel));

/** Hero → statement → work → capabilities → about → warp, which runs into the closing footer. */
export default function HomePage() {
  return (
    <>
      <StickerField />
      <Hero />
      <IntroSection />
      <WorkSection />
      <CapabilitiesSection />
      <AboutSection />
      <WarpTunnel />
    </>
  );
}
