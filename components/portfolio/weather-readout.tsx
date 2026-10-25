'use client';

import { useEffect, useState } from 'react';
import { portfolioConfig } from '@/lib/portfolio-config';

type Reading = { temperature: number; label: string };
type State = { status: 'loading' } | { status: 'ready'; reading: Reading } | { status: 'unavailable' };

const CACHE_KEY = 'gt-weather';

/** WMO weather interpretation codes, as used by Open-Meteo. */
function describe(code: number) {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Weather';
}

function readCache(): Reading | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { at: number; reading: Reading };
    return Date.now() - cached.at < portfolioConfig.weather.cacheMinutes * 60_000 ? cached.reading : null;
  } catch {
    return null;
  }
}

/**
 * Current weather in my city from Open-Meteo (no key, no visitor location). Shown only
 * when a real reading arrives; while loading it reserves nothing, and on any failure
 * (offline, blocked, timeout, bad data) it renders nothing at all.
 */
export function WeatherReadout() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const { enabled, latitude, longitude, timeoutMs } = portfolioConfig.weather;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;

    // Cache hits and network reads share one async path, so state is only ever set from a callback.
    const load = async (): Promise<Reading> => {
      const cached = readCache();
      if (cached) return cached;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
      const data = (await response.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
      const temperature = data.current?.temperature_2m;
      const code = data.current?.weather_code;
      if (typeof temperature !== 'number' || typeof code !== 'number') throw new Error('Unexpected weather data');
      const reading = { temperature: Math.round(temperature), label: describe(code) };
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), reading }));
      } catch {
        // Storage blocked: fine, we just refetch next time.
      }
      return reading;
    };

    load()
      .then((reading) => {
        if (active) setState({ status: 'ready', reading });
      })
      .catch(() => {
        // Covers offline, blocked, timeout (abort) and malformed responses alike.
        if (active) setState({ status: 'unavailable' });
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, latitude, longitude, timeoutMs]);

  if (!enabled || state.status !== 'ready') return null;
  return (
    <span className="tabular-nums">
      <span className="sr-only">
        Weather: {state.reading.temperature} degrees Celsius, {state.reading.label}
      </span>
      <span aria-hidden="true" className="mx-2 text-subtle">
        /
      </span>
      <span aria-hidden="true">
        {state.reading.temperature}°C <span className="text-subtle">{state.reading.label}</span>
      </span>
    </span>
  );
}
