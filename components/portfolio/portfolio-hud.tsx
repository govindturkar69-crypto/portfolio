import Link from 'next/link';
import { site } from '@/data/site';
import { HUDNav } from './hud-nav';
import { LocalClock } from './local-clock';
import { PointerReadout } from './pointer-readout';
import { WeatherReadout } from './weather-readout';

/**
 * Fixed viewport HUD: a hairline frame, the brand and live readouts top-left, and the
 * bracketed text navigation top-right. Server-rendered; clock, weather, pointer and nav
 * are client islands. The frame never receives pointer events.
 */
export function PortfolioHUD() {
  return (
    <>
      <div aria-hidden="true" className="hud-frame" />
      <div aria-hidden="true" className="hud-fade" />
      <header className="hud-top">
        <div className="flex min-w-0 flex-col gap-1">
          <Link href="/" data-magnetic className="hud-brand">
            {site.name}
            <sup className="hud-year">©{new Date().getFullYear()}</sup>
            <span className="sr-only">, home</span>
          </Link>
          <p className="hud-meta">
            <LocalClock />
            <WeatherReadout />
          </p>
          <p className="hud-meta hidden md:block">
            <PointerReadout />
          </p>
        </div>
        <HUDNav />
      </header>
    </>
  );
}
