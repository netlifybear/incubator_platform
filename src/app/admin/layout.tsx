import { notFound } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin?.cohortId || !admin.cohort) {
    notFound();
  }

  return (
    <AppShell founder={admin} cohortName={admin.cohort.name}>
      <AdminNav />
      {children}
    </AppShell>
  );
}
