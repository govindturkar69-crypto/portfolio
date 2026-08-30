type MotionFoundationOptions = {
  cursor?: HTMLElement | null;
  onPointerPosition?: (x: number, y: number) => void;
  onCursorLabel?: (label: string) => void;
};

const revealSelector = '.reveal,[data-motion-reveal]';
const transformSelector = '[data-motion-parallax],[data-motion-tilt],[data-motion-magnetic]';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function numberFrom(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resetTransform(element: HTMLElement | null) {
  if (!element) return;
  element.style.removeProperty('--motion-rotate-x');
  element.style.removeProperty('--motion-rotate-y');
  element.style.removeProperty('--motion-magnetic-x');
  element.style.removeProperty('--motion-magnetic-y');
  element.style.removeProperty('--motion-interaction-duration');
}

/**
 * One opt-in motion controller for the portfolio. Existing `.reveal` elements are
 * supported automatically; future effects use data-motion-* attributes.
 */
export function setupMotionFoundation({
  cursor,
  onPointerPosition,
  onCursorLabel,
}: MotionFoundationOptions = {}) {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const revealTargets = [...document.querySelectorAll<HTMLElement>(revealSelector)];
  const parallaxTargets = [
    ...document.querySelectorAll<HTMLElement>('[data-motion-parallax]'),
  ];

  document
    .querySelectorAll<HTMLElement>('[data-motion-stagger]')
    .forEach((group) => {
      group
        .querySelectorAll<HTMLElement>('[data-motion-stagger-item]')
        .forEach((item, index) =>
          item.style.setProperty('--motion-index', String(index)),
        );
    });

  let revealObserver: IntersectionObserver | null = null;
  let pointerFrame = 0;
  let scrollFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTarget: Element | null = null;
  let activeTilt: HTMLElement | null = null;
  let activeMagnetic: HTMLElement | null = null;

  const reveal = (element: HTMLElement) => {
    element.classList.add('on', 'is-inview');
  };

  const prepareReveals = () => {
    revealObserver?.disconnect();
    revealObserver = null;
    root.dataset.motion = reducedMotion.matches ? 'reduced' : 'full';
    root.classList.add('motion-ready');

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealTargets.forEach(reveal);
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            reveal(element);
            if (!element.hasAttribute('data-motion-repeat')) {
              revealObserver?.unobserve(element);
            }
          } else if (element.hasAttribute('data-motion-repeat')) {
            element.classList.remove('on', 'is-inview');
          }
        });
      },
      { threshold: 0.1 },
    );

    revealTargets
      .filter((element) => !element.classList.contains('on'))
      .forEach((element) => revealObserver?.observe(element));
  };

  const updateParallax = () => {
    scrollFrame = 0;
    if (reducedMotion.matches) return;

    const viewportCenter = window.innerHeight / 2;
    parallaxTargets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const speed = clamp(
        numberFrom(element.dataset.motionParallax, 0.08),
        -0.3,
        0.3,
      );
      const elementCenter = rect.top + rect.height / 2;
      element.style.setProperty(
        '--motion-parallax-y',
        `${((viewportCenter - elementCenter) * speed).toFixed(2)}px`,
      );
    });
  };

  const requestParallax = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateParallax);
  };

  const updatePointer = () => {
    pointerFrame = 0;
    cursor?.style.setProperty(
      'transform',
      `translate3d(${pointerX}px,${pointerY}px,0) translate(-50%,-50%)`,
    );
    onPointerPosition?.(pointerX, pointerY);

    if (reducedMotion.matches || !finePointer.matches || !pointerTarget) {
      resetTransform(activeTilt);
      resetTransform(activeMagnetic);
      activeTilt = null;
      activeMagnetic = null;
      return;
    }

    const nextTilt = pointerTarget.closest<HTMLElement>('[data-motion-tilt]');
    if (activeTilt !== nextTilt) resetTransform(activeTilt);
    activeTilt = nextTilt;
    if (activeTilt) {
      const rect = activeTilt.getBoundingClientRect();
      const strength = clamp(
        numberFrom(activeTilt.dataset.motionTilt, 6),
        0,
        12,
      );
      const x = clamp((pointerX - rect.left) / rect.width, 0, 1) - 0.5;
      const y = clamp((pointerY - rect.top) / rect.height, 0, 1) - 0.5;
      activeTilt.style.setProperty('--motion-rotate-x', `${-y * strength * 2}deg`);
      activeTilt.style.setProperty('--motion-rotate-y', `${x * strength * 2}deg`);
      activeTilt.style.setProperty('--motion-interaction-duration', '0ms');
    }

    const nextMagnetic = pointerTarget.closest<HTMLElement>('[data-motion-magnetic]');
    if (activeMagnetic !== nextMagnetic) resetTransform(activeMagnetic);
    activeMagnetic = nextMagnetic;
    if (activeMagnetic) {
      const rect = activeMagnetic.getBoundingClientRect();
      const strength = clamp(
        numberFrom(activeMagnetic.dataset.motionMagnetic, 0.14),
        0,
        0.25,
      );
      activeMagnetic.style.setProperty(
        '--motion-magnetic-x',
        `${(pointerX - (rect.left + rect.width / 2)) * strength}px`,
      );
      activeMagnetic.style.setProperty(
        '--motion-magnetic-y',
        `${(pointerY - (rect.top + rect.height / 2)) * strength}px`,
      );
      activeMagnetic.style.setProperty('--motion-interaction-duration', '0ms');
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (reducedMotion.matches || !finePointer.matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerTarget = event.target instanceof Element ? event.target : null;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointer);
  };

  const handlePointerOver = (event: PointerEvent) => {
    if (reducedMotion.matches || !finePointer.matches) {
      onCursorLabel?.('');
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    const contextualTarget = target?.closest<HTMLElement>(
      '[data-cursor-label],.project-open',
    );
    onCursorLabel?.(
      contextualTarget?.dataset.cursorLabel ??
        (contextualTarget?.classList.contains('project-open') ? 'VIEW' : ''),
    );
  };

  const resetPointerEffects = () => {
    resetTransform(activeTilt);
    resetTransform(activeMagnetic);
    activeTilt = null;
    activeMagnetic = null;
  };

  const handlePointerExit = () => {
    resetPointerEffects();
    onCursorLabel?.('');
  };

  const handlePointerCapability = () => {
    if (!finePointer.matches) handlePointerExit();
  };

  const handleMotionPreference = () => {
    prepareReveals();
    if (reducedMotion.matches) {
      handlePointerExit();
      document.querySelectorAll<HTMLElement>(transformSelector).forEach(resetTransform);
      parallaxTargets.forEach((element) =>
        element.style.removeProperty('--motion-parallax-y'),
      );
    } else {
      requestParallax();
    }
  };

  prepareReveals();
  requestParallax();
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerover', handlePointerOver, { passive: true });
  window.addEventListener('pointerleave', handlePointerExit);
  window.addEventListener('blur', handlePointerExit);
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax, { passive: true });
  reducedMotion.addEventListener('change', handleMotionPreference);
  finePointer.addEventListener('change', handlePointerCapability);

  return () => {
    revealObserver?.disconnect();
    window.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerover', handlePointerOver);
    window.removeEventListener('pointerleave', handlePointerExit);
    window.removeEventListener('blur', handlePointerExit);
    window.removeEventListener('scroll', requestParallax);
    window.removeEventListener('resize', requestParallax);
    reducedMotion.removeEventListener('change', handleMotionPreference);
    finePointer.removeEventListener('change', handlePointerCapability);
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    resetPointerEffects();
    root.classList.remove('motion-ready');
    delete root.dataset.motion;
  };
}
