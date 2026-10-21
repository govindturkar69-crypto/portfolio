export function StackPills({ stack, limit }: { stack: string[]; limit?: number }) {
  const shown = limit ? stack.slice(0, limit) : stack;
  const hidden = stack.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Tech stack">
      {shown.map((tool) => (
        <li key={tool} className="pill">
          {tool}
        </li>
      ))}
      {hidden > 0 ? (
        <li className="pill">
          +{hidden}
          <span className="sr-only"> more</span>
        </li>
      ) : null}
    </ul>
  );
}
