'use client';

import { useEffect, useState } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';

const { timeZone, timeZoneLabel, city } = portfolioConfig.hud;
const format = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });

/**
 * Live local time in my timezone. Renders a placeholder on the server (the server's clock
 * and time zone differ from the visitor's, which would cause a hydration mismatch), then
 * updates on each minute boundary: one state update per minute, not per second.
 */
export function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let interval = 0;
    const tick = () => setNow(new Date());
    tick();
    const toNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, toNextMinute);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <span className="tabular-nums">
      <span className="text-subtle">{city} </span>
      {now ? (
        <time dateTime={now.toISOString()} aria-label={`Local time in ${city}: ${format.format(now)} ${timeZoneLabel}`}>
          {format.format(now)}
        </time>
      ) : (
        <span aria-hidden="true">--:--</span>
      )}
      <span className="text-subtle"> {timeZoneLabel}</span>
    </span>
  );
}
