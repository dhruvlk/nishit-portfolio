import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton";
import { getAdminSession, requireAdmin } from "@/lib/auth";

/**
 * The admin is per-request by design (signed-in session + live data), so its
 * navigations are allowed to block; each page still streams a skeleton first.
 */
export const instant = false;

/** Every dashboard route is gated here (server-side) and again by RLS in Postgres. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

async function AdminEmail() {
  const session = await getAdminSession();
  return <>{session?.user.email ?? ""}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell email={<Suspense fallback={null}><AdminEmail /></Suspense>}>
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </AdminShell>
  );
}
