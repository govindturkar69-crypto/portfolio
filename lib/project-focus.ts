/**
 * The project a visitor is pointing at or focused on in the Work section (or null), so the
 * architecture visual can follow it without re-rendering the grid.
 */
let current: string | null = null;
const listeners = new Set<() => void>();

export const projectFocus = {
  get: () => current,
  set(slug: string | null) {
    if (slug === current) return;
    current = slug;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
