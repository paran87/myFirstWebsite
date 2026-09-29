import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Jeepney } from "@/components/illustrations/jeepney";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <p className="animate-fade-up font-display text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[9rem]">
        <span className="text-gradient">404</span>
      </p>
      <div className="animate-fade-up -mt-4 w-full max-w-sm" style={{ animationDelay: "120ms" }}>
        <div className="animate-float flex justify-center" style={{ animationDuration: "4s" }}>
          <Jeepney width={260} sign="WALANG DAAN" className="jeepney-bob" />
        </div>
      </div>
      <h1 className="animate-fade-up mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ animationDelay: "200ms" }}>
        This route doesn&rsquo;t exist.
      </h1>
      <p className="animate-fade-up mt-3 max-w-md text-lg font-medium text-foreground/75" style={{ animationDelay: "260ms" }}>
        The video or page you&rsquo;re looking for doesn&rsquo;t exist or may have been removed. Let&rsquo;s get you back
        on the road.
      </p>
      <Link
        href="/"
        className="animate-fade-up group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 dark:text-primary-foreground"
        style={{ animationDelay: "320ms" }}
      >
        <ArrowLeft className="h-4.5 w-4.5 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to Home
      </Link>
    </main>
  );
}
