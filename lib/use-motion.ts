import { useSyncExternalStore } from 'react';
import { motion } from './motion';

/** For effects that should re-run when motion is switched on or off. */
export function useReducedMotion() {
  return useSyncExternalStore(motion.subscribe, motion.reduced, () => false);
}

/** The visitor's switch, for the header controls. */
export function useMotionEnabled() {
  return useSyncExternalStore(motion.subscribe, motion.enabled, () => true);
}
