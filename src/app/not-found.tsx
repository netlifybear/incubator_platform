import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Not found
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          This vendor note is not available here.
        </h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          It may not exist, or it may belong to a different cohort. Private trust stays
          private by default.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white"
        >
          Back to vendors
        </Link>
      </section>
    </main>
  );
}
