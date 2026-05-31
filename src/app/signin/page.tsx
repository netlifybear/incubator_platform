import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-8 px-6 py-10 lg:grid-cols-[1fr_24rem]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Incubator Trust Platform
        </p>
        <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Private vendor notes, minus the Slack archaeology.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
          Sign in as a demo founder to browse cohort-scoped vendor reviews and add named
          recommendations other founders can trust.
        </p>
      </section>
      <SignInForm />
    </main>
  );
}
