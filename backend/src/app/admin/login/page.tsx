import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { tryGetAdmin } from "@/lib/auth";
import { siteConfig } from "@/lib/config";

/**
 * Sign-in is handled by Cloudflare Access: it sits in front of `/admin*` and
 * only lets approved people reach this app at all. Anyone who gets here with
 * a valid Access session is sent straight to the dashboard; anyone else sees
 * why (Access not configured, or their account is not on the allow-list).
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { redirectedFrom } = await searchParams;
  const session = await tryGetAdmin();
  if (session) {
    redirect(redirectedFrom?.startsWith("/admin") ? redirectedFrom : "/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{siteConfig.adminName}</h1>
          <p className="mt-2 text-sm text-muted">
            We could not verify a Cloudflare Access sign-in for this browser, or your account is not allowed to
            manage this site.
          </p>
        </div>
        <a
          href="/admin/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <ShieldCheck className="h-4 w-4" />
          Sign in with Cloudflare Access
        </a>
        <p className="text-xs text-muted">
          Only authorized administrators may access this dashboard. If this keeps happening, check that the
          Access application covers <code>/admin*</code> and that <code>ACCESS_TEAM_DOMAIN</code> and{" "}
          <code>ACCESS_AUD</code> are set on the Worker.
        </p>
      </div>
    </main>
  );
}
