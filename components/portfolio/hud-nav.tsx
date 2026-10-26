'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { site } from '@/data/site';
import { portfolioConfig } from '@/lib/portfolio-config';
import { sound } from '@/lib/sound';
import { theme } from '@/lib/theme';

/**
 * Top-right text navigation in bracketed mono groups: section links, then the quiet
 * controls (theme, sound) and a résumé download. The active link follows the section in view via an
 * IntersectionObserver band across the middle of the viewport (no scroll listener).
 */
export function HUDNav() {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  const soundOn = useSyncExternalStore(sound.subscribe, sound.isEnabled, () => false);
  // Server snapshot is light; the head script may already have applied dark before hydration.
  const dark = useSyncExternalStore(theme.subscribe, () => theme.get() === 'dark', () => false);

  useEffect(() => {
    if (pathname !== '/') return;
    const targets = portfolioConfig.dock
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-48% 0px -48% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      setActive(null);
    };
  }, [pathname]);

  return (
    <nav aria-label="Primary" className="hud-nav">
      <ul className="hud-group">
        {portfolioConfig.dock.map((item, index) => {
          const current = pathname === '/' && active === item.id;
          return (
            <li key={item.id} className="flex items-center">
              {index > 0 ? (
                <span aria-hidden="true" className="hud-sep">
                  /
                </span>
              ) : null}
              {/* Native anchors so hash targets scroll from any route. */}
              <a
                href={item.href}
                aria-current={current ? 'location' : undefined}
                data-magnetic
                onClick={() => sound.play('click')}
                className="hud-nav-link"
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>

      <ul className="hud-group">
        <li>
          <button
            type="button"
            data-magnetic
            className="hud-nav-link"
            data-theme-toggle
            onClick={() => {
              sound.play('click');
              theme.set(dark ? 'light' : 'dark');
            }}
          >
            Theme:{dark ? 'Ink' : 'Paper'}
            <span className="sr-only">, switch to {dark ? 'Paper (light)' : 'Ink (dark)'} theme</span>
          </button>
        </li>
        <li className="flex items-center">
          <span aria-hidden="true" className="hud-sep">
            /
          </span>
          <button
            type="button"
            data-magnetic
            className="hud-nav-link"
            data-sound-toggle
            onClick={() => void sound.setEnabled(!soundOn)}
          >
            Sound:{soundOn ? 'On' : 'Off'}
            <span className="sr-only">, turn interface sound {soundOn ? 'off' : 'on'}</span>
          </button>
        </li>
        <li className="flex items-center">
          <span aria-hidden="true" className="hud-sep">
            /
          </span>
          <a href={site.resume} download data-magnetic className="hud-nav-link">
            Résumé
            <span className="sr-only"> (PDF download)</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
