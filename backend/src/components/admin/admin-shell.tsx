"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

export function AdminShell({
  email,
  siteUrl,
  children,
}: {
  email: string;
  siteUrl?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} siteUrl={siteUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={email} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
