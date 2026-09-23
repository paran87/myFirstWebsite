import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <Compass className="h-10 w-10 text-muted" />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted">
        The video or page you&rsquo;re looking for doesn&rsquo;t exist or may have been removed.
      </p>
      <Link href="/" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
        Back to Home
      </Link>
    </main>
  );
}
