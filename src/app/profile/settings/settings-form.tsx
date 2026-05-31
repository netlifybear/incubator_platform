"use client";

import { useActionState } from "react";
import type { ProfileActionState } from "./actions";

type ProfileSettingsFormProps = {
  action: (state: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
  founder: {
    name: string | null;
    bio: string | null;
    startupUrl: string | null;
    startupName: string | null;
    profileSlug: string | null;
    publicProfileEnabled: boolean;
    profileCompletePercentage: number;
  };
  cohortName: string;
};

const initialState: ProfileActionState = {};

export function ProfileSettingsForm({ action, founder, cohortName }: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold">Public profile</h2>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-sm font-semibold">
          {founder.profileCompletePercentage}% complete
        </span>
      </div>

      <form action={formAction} className="mt-6 grid gap-6">
        <div>
          <label className="block text-sm font-semibold" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={founder.name ?? ""}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold" htmlFor="profileSlug">
            Public profile URL
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm">
            <span className="text-[var(--muted)]">/founder/</span>
            <input
              id="profileSlug"
              name="profileSlug"
              required
              defaultValue={founder.profileSlug ?? ""}
              className="flex-1 outline-none"
              placeholder="your-slug"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={founder.bio ?? ""}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            placeholder="What are you building? What stage is your startup at?"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold" htmlFor="startupName">
              Startup name
            </label>
            <input
              id="startupName"
              name="startupName"
              defaultValue={founder.startupName ?? ""}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              placeholder="Your startup"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="startupUrl">
              Startup URL
            </label>
            <input
              id="startupUrl"
              name="startupUrl"
              type="url"
              defaultValue={founder.startupUrl ?? ""}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white/50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Privacy
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Controls for what appears on your public founder page at{" "}
            <span className="font-semibold text-[var(--foreground)]">
              /founder/{founder.profileSlug ?? "your-slug"}
            </span>
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm font-semibold">
            <input
              name="publicProfileEnabled"
              type="checkbox"
              defaultChecked={founder.publicProfileEnabled}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <span>
              Public profile enabled
              <span className="mt-1 block font-normal leading-6 text-[var(--muted)]">
                When enabled, your profile at /founder/{founder.profileSlug ?? "your-slug"} is
                visible to anyone. Private reviews and cohort data never appear on
                public pages.
              </span>
            </span>
          </label>
          <p className="mt-4 rounded-xl bg-[var(--panel-strong)] p-3 text-xs leading-6 text-[var(--muted)]">
            Affiliated with <span className="font-semibold">{cohortName}</span>.
            Cohort affiliation is shown on your public profile for trust context.
            Private cohort reviews and internal activity remain hidden.
          </p>
        </div>

        {state.error ? (
          <p className="text-sm font-medium text-red-700">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm font-medium text-[var(--accent)]">{state.success}</p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
