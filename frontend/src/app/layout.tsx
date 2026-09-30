import type { Metadata } from "next";
import { Suspense } from "react";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteBackground } from "@/components/layout/site-background";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { siteConfig } from "@/lib/config";
import { getCategories } from "@/lib/api";
import "./globals.css";

// Barlow for text, Barlow Condensed for headings and numbers — a clean,
// slightly technical look that fits maps and data.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Street-Level Video Documentation`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories().catch(() => []);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable} ${barlow.className} h-full antialiased`}
    >
      <head>
        {/* Marks JS as available before first paint so scroll-reveal can hide
            content without a flash; no-JS visitors always see everything. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body id="top" className="flex min-h-full flex-col bg-transparent text-foreground">
        <Providers>
          <SiteBackground />
          <ScrollReveal />
          <Suspense fallback={null}>
            <Header categories={categories} />
          </Suspense>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
