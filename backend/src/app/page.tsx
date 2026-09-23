import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/config";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{siteConfig.adminName}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          This service hosts the private admin dashboard and REST API for {siteConfig.name}.
          It is not part of the public website.
        </p>
      </div>
      <Link
        href="/admin/login"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Go to Admin Login
      </Link>
    </main>
  );
}
