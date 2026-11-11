'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { site } from '@/data/site';
import { motion } from '@/lib/motion';
import { portfolioConfig } from '@/lib/portfolio-config';
import { sound } from '@/lib/sound';
import { theme } from '@/lib/theme';
import { useMotionEnabled } from '@/lib/use-motion';
import { ArrowUpRight, Download, GitHub, LinkedIn } from '../icons';

/**
 * Top-right text navigation in bracketed mono groups: section links, then the quiet
 * controls (theme, sound, motion) and a résumé download. The active link follows the section in view via an
 * IntersectionObserver band across the middle of the viewport (no scroll listener).
 * Below 768px the groups give way to a Menu button and a full-screen menu (MobileMenu).
 */
export function HUDNav() {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  const soundOn = useSyncExternalStore(sound.subscribe, sound.isEnabled, () => false);
  const motionOn = useMotionEnabled();
  // Server snapshot is light; the head script may already have applied dark before hydration.
  const dark = useSyncExternalStore(
    theme.subscribe,
    () => theme.get() === 'dark',
    () => false,
  );

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
    <>
      <MobileMenu active={pathname === '/' ? active : null} dark={dark} soundOn={soundOn} motionOn={motionOn} />
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
            <button type="button" data-magnetic className="hud-nav-link" data-sound-toggle onClick={() => void sound.setEnabled(!soundOn)}>
              Sound:{soundOn ? 'On' : 'Off'}
              <span className="sr-only">, turn interface sound {soundOn ? 'off' : 'on'}</span>
            </button>
          </li>
          <li className="flex items-center">
            <span aria-hidden="true" className="hud-sep">
              /
            </span>
            <button type="button" data-magnetic className="hud-nav-link" data-motion-toggle onClick={() => motion.set(!motionOn)}>
              Motion:{motionOn ? 'On' : 'Off'}
              <span className="sr-only">, turn animation {motionOn ? 'off' : 'on'}</span>
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
    </>
  );
}

/**
 * Phones: a Menu button opens a full-screen native <dialog> (focus trap, Esc, scroll lock)
 * with large section links, the theme / sound / motion / résumé controls and direct contact links.
 */
function MobileMenu({ active, dark, soundOn, motionOn }: { active: string | null; dark: boolean; soundOn: boolean; motionOn: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    sound.play('click');
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const hide = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <button type="button" className="hud-menu-button" aria-haspopup="dialog" aria-expanded={open} onClick={show}>
        Menu
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="mobile-menu"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) hide();
        }}
      >
        <div className="mobile-menu-inner">
          <div className="flex items-center justify-between">
            <p className="hud-meta">Menu</p>
            <button type="button" className="mobile-menu-close" onClick={hide}>
              Close
            </button>
          </div>

          <nav aria-label="Sections" className="mt-10">
            <ol>
              {portfolioConfig.dock.map((item, index) => (
                <li key={item.id} style={{ '--i': index } as React.CSSProperties}>
                  <a href={item.href} aria-current={active === item.id ? 'location' : undefined} className="mobile-menu-link" onClick={hide}>
                    <span className="mobile-menu-index">{String(index + 1).padStart(2, '0')}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mobile-menu-row" style={{ '--i': 3 } as React.CSSProperties}>
            <button
              type="button"
              className="mobile-menu-control"
              onClick={() => {
                sound.play('click');
                theme.set(dark ? 'light' : 'dark');
              }}
            >
              Theme: {dark ? 'Ink' : 'Paper'}
              <span className="sr-only">, switch to {dark ? 'Paper (light)' : 'Ink (dark)'} theme</span>
            </button>
            <button type="button" className="mobile-menu-control" onClick={() => void sound.setEnabled(!soundOn)}>
              Sound: {soundOn ? 'On' : 'Off'}
              <span className="sr-only">, turn interface sound {soundOn ? 'off' : 'on'}</span>
            </button>
            <button type="button" className="mobile-menu-control" onClick={() => motion.set(!motionOn)}>
              Motion: {motionOn ? 'On' : 'Off'}
              <span className="sr-only">, turn animation {motionOn ? 'off' : 'on'}</span>
            </button>
            <a href={site.resume} download className="mobile-menu-control">
              <Download size={14} />
              Résumé
              <span className="sr-only"> (PDF download)</span>
            </a>
          </div>

          <div className="mobile-menu-row" style={{ '--i': 4 } as React.CSSProperties}>
            <a href={`mailto:${site.email}`} className="mobile-menu-control">
              Email
              <ArrowUpRight size={14} />
            </a>
            <a href={site.github} target="_blank" rel="noopener noreferrer" className="mobile-menu-control">
              <GitHub size={14} />
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="mobile-menu-control">
              <LinkedIn size={14} />
              LinkedIn
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
