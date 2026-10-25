import type { AnchorHTMLAttributes, ReactNode } from 'react';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition duration-200 ease-out ' +
  'focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none';

export const buttonStyles = {
  primary: `${buttonBase} h-11 px-5 bg-fg text-bg hover:bg-fg/85 hover:shadow-[0_0_0_4px_var(--color-line)]`,
  secondary: `${buttonBase} h-11 px-5 border border-line-strong bg-fg/[0.03] text-fg hover:border-fg/30 hover:bg-fg/[0.07]`,
  ghost: `${buttonBase} h-9 px-3 text-muted hover:text-fg hover:bg-fg/[0.06]`,
  /** Third level: same height as primary/secondary, no fill, arrow nudges on hover. */
  tertiary: `${buttonBase} group h-11 px-3 text-fg hover:text-accent`,
};

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode };

/** Opens in a new tab and tells screen-reader users so. */
export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
