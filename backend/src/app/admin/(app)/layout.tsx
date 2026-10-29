import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  let email = "";
  try {
    const { profile } = await requireAdmin();
    email = profile.email;
  } catch {
    // Middleware already guards `/admin/*`, this is a defense-in-depth
    // fallback in case a session exists without a valid admin profile.
    redirect("/admin/login");
  }

  const siteUrl = (process.env.FRONTEND_URL || (process.env.ALLOWED_FRONTEND_ORIGINS ?? "").split(",")[0] || "").trim();

  return (
    <AdminShell email={email} siteUrl={siteUrl || undefined}>
      {children}
    </AdminShell>
  );
}
