'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const SELECTOR = '.reveal, [data-reveal]';

/**
 * One IntersectionObserver for every reveal on the page. Each element animates in once,
 * the first time it enters the viewport, and is never hidden again (no replay while
 * scrolling back and forth).
 *
 * Hidden states only apply under html[data-reveal-ready], which this component sets after
 * hydration and only when motion is allowed. Without JS, or with reduced motion, all
 * content is simply visible.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const html = document.documentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = '';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    const watch = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => {
        if (!('revealed' in element.dataset)) observer.observe(element);
      });
    };
    watch();
    html.dataset.revealReady = '';
    // Route changes and late-rendered islands bring new reveal targets.
    const mutations = new MutationObserver(watch);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
