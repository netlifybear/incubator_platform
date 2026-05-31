"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCredentials(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        setError("Those demo credentials did not match a seeded founder.");
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    });
  }

  function handleMagicLink(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const email = String(formData.get("magicEmail") ?? "");
      if (!email) {
        setError("Enter your email address.");
        return;
      }

      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Could not send magic link. Check the email and try again.");
        return;
      }

      setMagicSent(true);
    });
  }

  if (magicSent) {
    return (
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Check your email</h2>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          A sign-in link has been sent. Click it to sign in (expires in 24 hours).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        action={handleMagicLink}
        className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm"
      >
        <h2 className="text-2xl font-semibold">Sign in with email</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Enter your email to receive a magic sign-in link. No password needed.
        </p>

        <label className="mt-6 block text-sm font-semibold" htmlFor="magic-email">
          Email
        </label>
        <input
          id="magic-email"
          name="magicEmail"
          type="email"
          required
          placeholder="you@example.com"
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        />

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full cursor-pointer rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send magic link"}
        </button>
      </form>

      <details className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <summary className="cursor-pointer text-xl font-semibold marker:text-[var(--accent)]">
          Demo sign in
        </summary>
        <form action={handleCredentials} className="mt-4">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Use <span className="font-semibold">maya@example.com</span> /{" "}
            <span className="font-semibold">password</span> (founder) or{" "}
            <span className="font-semibold">admin@example.com</span> /{" "}
            <span className="font-semibold">password</span> (admin).
          </p>

          <label className="mt-6 block text-sm font-semibold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue="maya@example.com"
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />

          <label className="mt-5 block text-sm font-semibold" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            defaultValue="password"
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />

          {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-6 w-full cursor-pointer rounded-full border border-[var(--border)] bg-white px-5 py-3 font-semibold transition hover:bg-[var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Signing in..." : "Sign in with demo"}
          </button>
        </form>
      </details>
    </div>
  );
}
