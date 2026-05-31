export default function RootLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="animate-pulse rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <div className="h-4 w-24 rounded-full bg-[var(--panel-strong)]" />
        <div className="mt-6 h-8 w-3/4 rounded-full bg-[var(--panel-strong)]" />
        <div className="mt-4 h-5 w-1/2 rounded-full bg-[var(--panel-strong)]" />
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <div className="h-5 w-20 rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-4 h-7 w-2/3 rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-6 h-4 w-1/3 rounded-full bg-[var(--panel-strong)]" />
        </div>
        <div className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <div className="h-5 w-20 rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-4 h-7 w-1/2 rounded-full bg-[var(--panel-strong)]" />
          <div className="mt-6 h-4 w-1/3 rounded-full bg-[var(--panel-strong)]" />
        </div>
      </div>
    </div>
  );
}
