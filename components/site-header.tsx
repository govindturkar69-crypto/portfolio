import Link from 'next/link';
import { navigation, site } from '@/data/site';
import { CommandTrigger } from './command-palette';
import { Search } from './icons';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-mono text-sm tracking-tight text-fg"
          aria-label={`${site.name}, home`}
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md border border-line-strong bg-surface-2 text-xs font-semibold transition-colors duration-200 group-hover:border-accent/60"
          >
            GT
          </span>
          <span className="hidden sm:inline">govind turkar</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                {/* Native anchors: hash targets must scroll, including from case-study pages. */}
                <a
                  href={item.href}
                  className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors duration-200 hover:text-fg"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <CommandTrigger className="inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] pr-1.5 pl-3 text-sm text-muted transition duration-200 hover:border-white/30 hover:text-fg">
            <Search size={15} />
            <span className="md:hidden">Menu</span>
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs text-subtle md:inline">
              ⌘K
            </kbd>
          </CommandTrigger>
          <a
            href={site.resume}
            download
            className="hidden h-9 items-center rounded-full bg-fg px-4 text-sm font-medium text-bg transition duration-200 hover:bg-white sm:inline-flex"
          >
            Résumé
          </a>
        </div>
      </div>
    </header>
  );
}
