import Link from 'next/link';
import { container } from '@/components/portfolio/home-sections';
import { buttonStyles } from '@/components/ui';

export default function NotFound() {
  return (
    <section className={`${container} flex min-h-[70vh] flex-col items-start justify-center pt-32 pb-24`}>
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">This page doesn&apos;t exist.</h1>
      <p className="mt-4 text-muted">The link may be out of date. Everything else is one click away.</p>
      <Link href="/" className={`${buttonStyles.primary} mt-8`}>
        Back home
      </Link>
    </section>
  );
}
