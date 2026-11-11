'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import type { Project } from '@/data/projects';

/*
 * Every project, filterable by area (the first part of each category, e.g. "Full-stack") and
 * searchable by name, description, category or technology. Rows are rendered by the caller so
 * they stay identical to the rest of the Work section. The count is announced politely.
 */

const area = (project: Project) => project.category.split(' · ')[0];

export function ProjectArchive({ projects, renderRow }: { projects: Project[]; renderRow: (project: Project) => ReactNode }) {
  const id = useId();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  const areas = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(area(p), (counts.get(area(p)) ?? 0) + 1));
    return [['All', projects.length] as const, ...[...counts.entries()].sort((a, b) => b[1] - a[1])];
  }, [projects]);

  const needle = query.trim().toLowerCase();
  const shown = projects.filter(
    (p) =>
      (filter === 'All' || area(p) === filter) &&
      (!needle || [p.name, p.tagline, p.category, ...p.stack].some((field) => field.toLowerCase().includes(needle))),
  );

  return (
    <div>
      <div className="archive-controls">
        <div role="group" aria-label="Filter projects by area" className="archive-filters">
          {areas.map(([name, count]) => (
            <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)} className="archive-filter">
              {name}
              <span className="tabular-nums text-subtle">{count}</span>
            </button>
          ))}
        </div>
        <div className="archive-search">
          <label htmlFor={`${id}-q`} className="sr-only">
            Search projects
          </label>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or technology"
            autoComplete="off"
            className="archive-input"
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-xs tracking-[0.04em] text-subtle uppercase" aria-live="polite">
        Showing {shown.length} of {projects.length}
        {filter !== 'All' ? ` · ${filter}` : ''}
        {needle ? ` · “${query.trim()}”` : ''}
      </p>

      {shown.length ? (
        <ul className="mt-2">
          {shown.map((project) => (
            <li key={project.slug}>{renderRow(project)}</li>
          ))}
        </ul>
      ) : (
        <div className="archive-empty">
          <p className="text-lg font-medium">No projects match that.</p>
          <p className="mt-1 text-[15px] text-muted">Try another technology, or clear the filters.</p>
          <button
            type="button"
            className="work-action mt-3 text-sm"
            onClick={() => {
              setFilter('All');
              setQuery('');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
