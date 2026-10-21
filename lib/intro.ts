/** Plain module (not 'use client') so the server layout can inline the script. */
export const INTRO_FLAG = 'gt-intro-seen';

/*
 * Runs in <head> before first paint. Plays only for a fresh, top-of-page visit to "/"
 * (no hash deep link, no reload) once per session, never with reduced motion. If the
 * component never hydrates, a 6s fail-safe removes the overlay; the component cancels that
 * timer when it takes over (window.__introFailsafe). Scroll is locked by JS only.
 */
export const introDecisionScript = `(function(){try{var d=document.documentElement,n=performance.getEntriesByType('navigation')[0];if(location.pathname!=='/'||location.hash||(n&&n.type==='reload')||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('${INTRO_FLAG}'))return;sessionStorage.setItem('${INTRO_FLAG}','1');d.setAttribute('data-intro','play');window.__introFailsafe=setTimeout(function(){d.removeAttribute('data-intro')},6000)}catch(e){}})();`;

