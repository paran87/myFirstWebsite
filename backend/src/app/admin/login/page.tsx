import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isPasswordLoginConfigured } from "@/lib/admin-session";
import { tryGetAdmin } from "@/lib/auth";
import { siteConfig } from "@/lib/config";

/** Only same-site admin paths are allowed as a post-login destination. */
function safeDestination(value: string | undefined): string {
  if (value && value.startsWith("/admin") && !value.startsWith("//") && !value.startsWith("/admin/login")) {
    return value;
  }
  return "/admin/dashboard";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { redirectedFrom } = await searchParams;
  const destination = safeDestination(redirectedFrom);

  if (await tryGetAdmin()) redirect(destination);

  return (
    <LoginForm
      adminName={siteConfig.adminName}
      redirectTo={destination}
      enabled={isPasswordLoginConfigured()}
    />
  );
}
