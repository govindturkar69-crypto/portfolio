'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { projects } from '@/data/projects';
import { navigation, site } from '@/data/site';
import { writeClipboard } from '@/lib/clipboard';
import { ArrowUpRight, Copy, Download, GitHub, Hash, Layers, LinkedIn, Mail, Search } from './icons';

export const OPEN_PALETTE_EVENT = 'command-palette:open';

/** Lets any button open the palette without sharing React state. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

type Group = 'Navigate' | 'Projects' | 'Actions' | 'Elsewhere';

type Action =
  | { type: 'route'; href: string }
  | { type: 'external'; href: string }
  | { type: 'copy-email' }
  | { type: 'mailto' }
  | { type: 'download'; href: string };

type Command = {
  id: string;
  label: string;
  group: Group;
  icon: ReactNode;
  hint?: string;
  keywords?: string;
  action: Action;
};

const groupOrder: Group[] = ['Navigate', 'Projects', 'Actions', 'Elsewhere'];

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every query token must match the start of a word, so "rag" finds RAG but not "storage". */
function matches(command: Command, query: string) {
  if (!query) return true;
  const haystack = `${command.label} ${command.group} ${command.keywords ?? ''}`;
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}`, 'i').test(haystack));
}

export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const baseId = useId();

  const show = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery('');
    setActive(0);
    setNotice('');
    dialog.showModal();
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      ...navigation.map((item) => ({
        id: `nav-${item.label}`,
        label: item.label,
        group: 'Navigate' as const,
        icon: <Hash />,
        hint: 'Section',
        action: { type: 'route' as const, href: item.href },
      })),
      ...projects.map((project) => ({
        id: `project-${project.slug}`,
        label: project.name,
        group: 'Projects' as const,
        icon: <Layers />,
        hint: project.category,
        keywords: `${project.tagline} ${project.stack.join(' ')} case study`,
        action: { type: 'route' as const, href: `/work/${project.slug}` },
      })),
      {
        id: 'copy-email',
        label: 'Copy email address',
        group: 'Actions',
        icon: <Copy />,
        hint: site.email,
        keywords: 'contact mail clipboard',
        action: { type: 'copy-email' },
      },
      {
        id: 'email',
        label: 'Send an email',
        group: 'Actions',
        icon: <Mail />,
        keywords: 'contact mailto hire',
        action: { type: 'mailto' },
      },
      {
        id: 'resume',
        label: 'Download résumé',
        group: 'Actions',
        icon: <Download />,
        hint: 'PDF',
        keywords: 'resume cv pdf',
        action: { type: 'download', href: site.resume },
      },
      {
        id: 'github',
        label: 'GitHub',
        group: 'Elsewhere',
        icon: <GitHub />,
        hint: 'Opens in a new tab',
        keywords: 'code source repositories',
        action: { type: 'external', href: site.github },
      },
      {
        id: 'linkedin',
        label: 'LinkedIn',
        group: 'Elsewhere',
        icon: <LinkedIn />,
        hint: 'Opens in a new tab',
        keywords: 'profile connect',
        action: { type: 'external', href: site.linkedin },
      },
    ],
    [],
  );

  const results = useMemo(() => commands.filter((command) => matches(command, query.trim())), [commands, query]);

  const grouped = useMemo(
    () =>
      groupOrder
        .map((group) => ({ group, items: results.filter((command) => command.group === group) }))
        .filter((section) => section.items.length > 0),
    [results],
  );

  const optionId = (index: number) => `${baseId}-option-${index}`;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  /**
   * Hash targets on the current page scroll natively; vinext's client router
   * does not scroll to a hash, so cross-page section links do a full navigation.
   */
  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (!url.hash) {
        router.push(href);
        return;
      }
      if (url.pathname === window.location.pathname) {
        document.querySelector(url.hash)?.scrollIntoView({ block: 'start' });
        history.pushState(null, '', url.hash);
        return;
      }
      window.location.assign(url.href);
    },
    [router],
  );

  const execute = useCallback(
    async (command: Command | undefined) => {
      if (!command) return;
      const { action } = command;
      if (action.type === 'copy-email') {
        try {
          await writeClipboard(site.email);
          setNotice(`Copied ${site.email}`);
          window.setTimeout(hide, 700);
        } catch {
          setNotice(`Copy failed — the address is ${site.email}`);
        }
        return;
      }
      hide();
      switch (action.type) {
        case 'route':
          navigate(action.href);
          break;
        case 'external':
          window.open(action.href, '_blank', 'noopener,noreferrer');
          break;
        case 'mailto':
          window.location.href = `mailto:${site.email}`;
          break;
        case 'download': {
          const link = document.createElement('a');
          link.href = action.href;
          link.download = '';
          link.click();
          break;
        }
      }
    },
    [hide, navigate],
  );

  // Global shortcuts: ⌘K / Ctrl+K toggles, "/" opens when not typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isToggle = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (isToggle) {
        event.preventDefault();
        if (dialogRef.current?.open) hide();
        else show();
        return;
      }
      if (event.key === '/' && !isEditable(event.target) && !dialogRef.current?.open) {
        event.preventDefault();
        show();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
    };
  }, [hide, show]);

  // Keep the highlighted option in view while arrowing through the list.
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on baseId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((activeIndex + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((activeIndex - 1 + results.length) % results.length);
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(results.length - 1);
        break;
      case 'Enter':
        event.preventDefault();
        void execute(results[activeIndex]);
        break;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${baseId}-title`}
      className="cmdk m-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-2xl shadow-black/60"
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) hide();
      }}
    >
      <h2 id={`${baseId}-title`} className="sr-only">
        Command menu
      </h2>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="shrink-0 text-subtle" size={18} />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${baseId}-list`}
          aria-activedescendant={results.length ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          aria-label="Search pages, projects and actions"
          placeholder="Search projects, sections, actions…"
          spellCheck={false}
          autoComplete="off"
          className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
        />
        <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-xs text-subtle sm:block">ESC</kbd>
      </div>

      <ul
        ref={listRef}
        id={`${baseId}-list`}
        role="listbox"
        aria-label="Commands"
        className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-2"
      >
        {grouped.map(({ group, items }) => (
          <li key={group} role="presentation">
            <p id={`${baseId}-${group}`} className="eyebrow px-3 pt-3 pb-1.5" aria-hidden="true">
              {group}
            </p>
            <ul role="group" aria-labelledby={`${baseId}-${group}`}>
              {items.map((command) => {
                const index = results.indexOf(command);
                const selected = index === activeIndex;
                return (
                  <li
                    key={command.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(index)}
                    onClick={() => void execute(command)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                      selected ? 'bg-white/[0.07] text-fg' : 'text-muted'
                    }`}
                  >
                    <span className={selected ? 'text-accent' : 'text-subtle'}>{command.icon}</span>
                    <span className="truncate">{command.label}</span>
                    {command.hint ? (
                      <span className="ml-auto truncate pl-4 font-mono text-xs text-subtle">{command.hint}</span>
                    ) : null}
                    {selected ? <ArrowUpRight className="shrink-0 text-subtle" size={14} /> : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
        {results.length === 0 ? (
          <li role="presentation" className="px-3 py-10 text-center text-sm text-subtle">
            No results for “{query}”
          </li>
        ) : null}
      </ul>

      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 font-mono text-xs text-subtle">
        <span role="status" aria-live="polite" className={notice ? 'text-live' : undefined}>
          {notice || `${results.length} result${results.length === 1 ? '' : 's'}`}
        </span>
        <span className="hidden gap-3 sm:flex" aria-hidden="true">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
        </span>
      </div>
    </dialog>
  );
}

export function CommandTrigger({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={openCommandPalette} aria-haspopup="dialog" className={className}>
      {children}
    </button>
  );
}
