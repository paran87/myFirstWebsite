import { redirect } from "next/navigation";

/** /admin → dashboard (proxy sends unauthenticated users to /admin/login). */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
