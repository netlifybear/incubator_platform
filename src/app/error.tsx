"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Something went wrong
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          This page could not be loaded.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          A temporary error occurred while loading this page. This is usually a database
          connection issue or a brief server hiccup.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Error reference: {error.digest}
          </p>
        ) : null}
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
