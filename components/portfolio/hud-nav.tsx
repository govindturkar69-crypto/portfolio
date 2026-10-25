'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';
import { sound } from '@/lib/sound';
import { theme } from '@/lib/theme';
import { openCommandPalette } from '../command-palette';

/**
 * Top-right text navigation in bracketed mono groups: section links, then the quiet
 * controls (theme, sound, search). The active link follows the section in view via an
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
            aria-pressed={dark}
            aria-label="Dark theme"
            onClick={() => {
              sound.play('click');
              theme.set(dark ? 'light' : 'dark');
            }}
          >
            <span aria-hidden="true">Theme:{dark ? 'Ink' : 'Paper'}</span>
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
            aria-pressed={soundOn}
            aria-label="Interface sound"
            onClick={() => void sound.setEnabled(!soundOn)}
          >
            <span aria-hidden="true">Sound:{soundOn ? 'On' : 'Off'}</span>
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
            aria-haspopup="dialog"
            aria-label="Search and quick navigation"
            onClick={() => {
              sound.play('click');
              openCommandPalette();
            }}
          >
            <span aria-hidden="true">⌘K</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
