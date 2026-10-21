/**
 * Editorial hero configuration: copy, motion ranges and timing.
 * Colours and sizes live as CSS variables on `.hero-tokens` in app/globals.css.
 */
export const heroCopy = {
  /** Small mono line above the name. */
  kicker: 'SELECT * FROM',
  /** The name, split into the two display lines. */
  nameLines: ['Govind', 'Turkar'],
  tagline: 'Full-stack products. Down to the storage engine.',
  /** Appears as the head opens: the editorial hand-off into the descent. */
  reveal: {
    eyebrow: 'Opening the stack',
    heading: 'What’s inside?',
    body: 'Systems, all the way down.',
  },
  /** Accessible name for the illustration. */
  characterLabel: 'Illustrated portrait of Govind Turkar, arms crossed',
} as const;

export const heroMotion = {
  /** Scroll length of the pinned hero on ≥768px screens. */
  sceneLength: '260vh',
  /** Seconds of scrub smoothing; matches the descent scenes. */
  scrub: 0.5,
  eyes: {
    /** Max pupil travel inside the eye, in SVG units (x, y). */
    reach: [8, 5] as const,
    /** Fraction of the remaining distance covered per frame (lerp factor at 60fps). */
    ease: 0.14,
    /** Pointer distance (as a fraction of viewport width) at which pupils hit full reach. */
    fullReachAt: 0.32,
  },
  head: {
    /** Max head tilt toward the pointer, degrees. */
    tilt: 2,
  },
  blink: { minGap: 3.6, maxGap: 7.2 },
  /** Lift of each skull layer when fully open, in SVG units (bottom → top). */
  strataLift: [44, 104, 172] as const,
  strataTilt: [-2.5, 3, -4] as const,
} as const;
