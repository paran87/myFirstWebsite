export const siteConfig = {
  /** Change the public site name here (or override via env) — used across
   * the header, page titles, and metadata. */
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Walk Metro Manila",
  description:
    "Street-level video documentation of Metro Manila, captured with a body camera for mapping, presentation, and reference.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:4000",
};

/** Base URL of the backend API. Never hard-code localhost outside dev. */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const CATEGORIES_FALLBACK_ICON = "Tag";
