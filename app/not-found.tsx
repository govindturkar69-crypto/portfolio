import Link from 'next/link';
import { buttonStyles } from '@/components/ui';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-start justify-center px-4 py-24 sm:px-6">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">This page doesn&apos;t exist.</h1>
      <p className="mt-4 text-muted">The link may be out of date. Everything else is one click away.</p>
      <Link href="/" className={`${buttonStyles.primary} mt-8`}>
        Back home
      </Link>
    </section>
  );
}
