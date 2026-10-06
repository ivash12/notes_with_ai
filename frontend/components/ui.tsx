import Link from "next/link";
import type { ReactNode } from "react";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-xl text-base text-pretty text-muted sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rise rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function BackLink() {
  return (
    <Link
      href="/"
      className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-accent"
    >
      <span aria-hidden>←</span> Back to your notes
    </Link>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <Card>
      <div role="status" className="flex items-center gap-3 text-muted">
        <span
          aria-hidden
          className="size-5 animate-spin rounded-full border-2 border-line border-t-accent"
        />
        {label}
      </div>
      <div aria-hidden className="mt-6 space-y-3">
        <div className="h-3 w-11/12 animate-pulse rounded bg-line" />
        <div className="h-3 w-full animate-pulse rounded bg-line" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-line" />
      </div>
    </Card>
  );
}

export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <p role="alert" className="font-medium text-bad">
        {message}
      </p>
      <button type="button" onClick={onRetry} className={`${primaryButton} mt-5`}>
        Try again
      </button>
    </Card>
  );
}

export function NoPhoto() {
  return (
    <Card>
      <p className="text-muted">You haven&apos;t uploaded a photo of your notes yet.</p>
      <Link href="/" className={`${primaryButton} mt-5`}>
        Upload a photo
      </Link>
    </Card>
  );
}
