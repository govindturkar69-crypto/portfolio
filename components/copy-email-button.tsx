'use client';

import { useEffect, useRef, useState } from 'react';
import { writeClipboard } from '@/lib/clipboard';
import { Check, Copy } from './icons';

type Props = {
  email: string;
  className?: string;
};

export function CopyEmailButton({ email, className = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    window.clearTimeout(timer.current);
    try {
      await writeClipboard(email);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    timer.current = window.setTimeout(() => setStatus('idle'), 2200);
  }

  const label =
    status === 'copied' ? 'Copied to clipboard' : status === 'failed' ? 'Press Ctrl+C to copy' : 'Copy email';

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={className}
        aria-label={status === 'idle' ? `Copy email address ${email}` : undefined}
      >
        <span className="relative inline-flex size-4 items-center justify-center">
          <Copy
            className={`absolute transition duration-200 ease-out ${status === 'copied' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}`}
          />
          <Check
            className={`absolute text-live transition duration-200 ease-out ${status === 'copied' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
          />
        </span>
        <span>{label}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === 'copied' ? 'Email address copied to clipboard' : status === 'failed' ? 'Copy failed' : ''}
      </span>
    </>
  );
}
