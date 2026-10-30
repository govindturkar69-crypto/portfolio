'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { site } from '@/data/site';
import { ArrowRight } from '../icons';
import { buttonStyles } from '../ui';

/*
 * Contact form for a static site: there is no server to send mail, so the form says so and
 * composes the message in the visitor's own email app (mailto:). Nothing leaves the page until
 * they press Send there. Fields are validated in place, with errors announced and focus moved
 * to the first problem.
 */

type Field = 'name' | 'email' | 'message';
type Errors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Please add your name.';
  if (!EMAIL.test(values.email.trim())) errors.email = 'Please add an email address I can reply to.';
  if (values.message.trim().length < 20) errors.message = 'Please write a little more (at least 20 characters).';
  return errors;
}

export function ContactForm() {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'opened'>('idle');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = { name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), message: String(data.get('message') ?? '') };
    const found = validate(values);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      setStatus('idle');
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const subject = `Portfolio enquiry from ${values.name.trim()}`;
    const body = `${values.message.trim()}\n\n— ${values.name.trim()}\nReply to: ${values.email.trim()}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus('opened');
  };

  const field = (name: Field) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
    onChange: () => {
      if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
    },
  });

  const error = (name: Field) =>
    errors[name] ? (
      <p id={`${id}-${name}-error`} className="contact-error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="contact-form" aria-describedby={`${id}-note`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="contact-label">
            Name
          </label>
          <input {...field('name')} type="text" autoComplete="name" className="contact-input" />
          {error('name')}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="contact-label">
            Your email
          </label>
          <input {...field('email')} type="email" inputMode="email" autoComplete="email" className="contact-input" />
          {error('email')}
        </div>
      </div>
      <div className="mt-5">
        <label htmlFor={`${id}-message`} className="contact-label">
          Message
        </label>
        <textarea {...field('message')} rows={5} className="contact-input contact-textarea" />
        {error('message')}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className={buttonStyles.primary}>
          Write the email
          <ArrowRight size={16} />
        </button>
        <p id={`${id}-note`} className="max-w-[40ch] text-sm text-subtle">
          Opens your email app with this message ready — nothing is sent until you press Send there.
        </p>
      </div>
      <p role="status" className="mt-4 min-h-6 text-sm">
        {status === 'opened' ? (
          <span className="text-fg">
            Your email app should now be open with the message. If nothing happened, write to{' '}
            <a href={`mailto:${site.email}`} className="underline underline-offset-4">
              {site.email}
            </a>{' '}
            directly.
          </span>
        ) : null}
      </p>
    </form>
  );
}
