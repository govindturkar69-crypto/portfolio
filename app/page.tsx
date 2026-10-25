import { Hero } from '@/components/portfolio/hero';
import { AboutSection, CapabilitiesSection, IntroSection, WorkSection } from '@/components/portfolio/home-sections';
import { WarpTunnel } from '@/components/portfolio/warp-tunnel';

/** Hero → statement → work → capabilities → about → warp, which runs into the closing footer. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <WorkSection />
      <CapabilitiesSection />
      <AboutSection />
      <WarpTunnel />
    </>
  );
}
