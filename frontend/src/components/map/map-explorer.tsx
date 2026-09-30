"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Film, Home, ImageIcon, Menu, X } from "lucide-react";

export type ListKind = "video" | "photo";

const KINDS = {
  video: { label: "Video", list: "Videos", icon: Film, backHref: "/", backLabel: "Back to catalog" },
  photo: { label: "Photo", list: "Photos", icon: ImageIcon, backHref: "/photos", backLabel: "Back to photos" },
} as const;

const tabClass = (current: boolean) =>
  `flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-sm font-bold transition ${
    current
      ? "bg-brand-gradient text-white shadow-md shadow-primary/25 dark:text-primary-foreground"
      : "text-foreground/75 hover:bg-surface hover:text-primary"
  }`;

/**
 * Shared shell for the video and photo pages.
 *
 * Desktop (lg+): back link and filters on top, then three columns —
 * map | media + details | list.
 *
 * Phones/tablets (< lg), a map-first "explorer" (see `.explorer` in
 * globals.css): the map fills the screen and stays put, the list slides in
 * from the ☰ button, and the selected item's player/details sit in a bottom
 * sheet that collapses to a title bar. Picking an item closes the list and
 * opens the sheet while the map flies to it.
 *
 * The Videos/Photos tabs only swap the list in place; nothing navigates
 * until an item in it is picked.
 */
export function MapExplorer({
  activeId,
  activeTitle,
  kind,
  listKind,
  onListKindChange,
  listCount,
  filters,
  map,
  list,
  children,
}: {
  activeId: string;
  activeTitle: string | null;
  kind: ListKind;
  listKind: ListKind;
  onListKindChange: (kind: ListKind) => void;
  listCount: number;
  filters: ReactNode;
  map: ReactNode;
  list: ReactNode;
  children: ReactNode;
}) {
  const { label: kindLabel, backHref, backLabel } = KINDS[kind];
  const { label: listLabel, list: listTitle } = KINDS[listKind];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);

  // A new item was selected (list, map pin or link): show its details and
  // get the list out of the way. Adjusting state during render on a changed
  // value is React's recommended alternative to an effect here.
  const [shownId, setShownId] = useState(activeId);
  if (shownId !== activeId) {
    setShownId(activeId);
    setDrawerOpen(false);
    setSheetOpen(true);
  }

  return (
    <main
      className={`explorer animate-fade-in mx-auto w-full max-w-[1920px] px-4 py-6 lg:px-6 2xl:px-8 ${
        sheetOpen ? "sheet-open" : ""
      } ${drawerOpen ? "drawer-open" : ""}`}
    >
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-base font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:text-primary max-lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="z-20 mb-4 max-lg:hidden lg:sticky lg:top-16">{filters}</div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1.15fr)_minmax(17rem,0.75fr)] 2xl:gap-6">
        <div className="explorer-map-slot order-2 min-w-0 xl:order-none">{map}</div>

        <section className="explorer-sheet order-1 flex min-h-0 min-w-0 flex-col gap-3 xl:order-none" aria-label={`${kindLabel} details`}>
          <button
            type="button"
            onClick={() => setSheetOpen((open) => !open)}
            aria-expanded={sheetOpen}
            className="explorer-sheet-handle relative flex w-full shrink-0 items-center justify-center gap-2 px-4 text-base font-bold lg:hidden"
          >
            <span className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/20" aria-hidden />
            <span className="truncate">{activeTitle ?? `Loading ${kindLabel.toLowerCase()}…`}</span>
            {sheetOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
            )}
          </button>
          <div className="explorer-sheet-body flex min-h-0 flex-col gap-3">{children}</div>
        </section>

        <div className="explorer-drawer order-3 min-w-0 xl:order-none">
          {/* Quick switch: Home, or swap the list between videos and photos */}
          <div className="mb-3 flex items-center gap-2">
            <nav aria-label="Sections" className="flex flex-1 gap-1 rounded-full border border-border bg-surface-2/70 p-1">
              <Link href="/" onClick={() => setDrawerOpen(false)} className={tabClass(false)}>
                <Home className="h-4 w-4" />
                Home
              </Link>
              {(Object.keys(KINDS) as ListKind[]).map((key) => {
                const { list, icon: Icon } = KINDS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={listKind === key}
                    onClick={() => onListKindChange(key)}
                    className={tabClass(listKind === key)}
                  >
                    <Icon className="h-4 w-4" />
                    {list}
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="shrink-0 rounded-full p-2 text-foreground/70 hover:bg-surface-2 lg:hidden"
              aria-label="Close list"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-3 lg:hidden">
            <p className="font-display text-xl font-extrabold leading-tight">{listTitle}</p>
            <p className="text-xs font-medium text-foreground/65">
              {listCount} {listLabel.toLowerCase()}
              {listCount === 1 ? "" : "s"} · tap one to see it on the map
            </p>
          </div>
          <div className="mb-3 lg:hidden">{filters}</div>
          {list}
        </div>
      </div>

      {/* Phone controls */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="explorer-menu-button fixed left-3 top-[4.75rem] z-30 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#13203b] text-white shadow-xl lg:hidden"
        aria-label={`Show ${listTitle.toLowerCase()}`}
      >
        <Menu className="h-6 w-6" />
      </button>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close list"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-x-0 bottom-0 top-16 z-[35] bg-black/45 lg:hidden"
        />
      )}
    </main>
  );
}
