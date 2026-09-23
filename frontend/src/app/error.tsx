"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
      <ErrorState message="Something went wrong loading this page." onRetry={reset} />
    </main>
  );
}
