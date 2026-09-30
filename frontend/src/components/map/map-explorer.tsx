"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Film, Home, ImageIcon } from "lucide-react";
import { setExplorerListOpen, useExplorerListOpen } from "@/lib/explorer-list";

export type ListKind = "video" | "photo";

const KINDS = {
  video: { label: "Video", list: "Videos", icon: Film, backHref: "/videos", backLabel: "Back to videos" },
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
 * from the header's ☰ button, and the selected item's player/details sit in a bottom
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
  const drawerOpen = useExplorerListOpen();
  const setDrawerOpen = setExplorerListOpen;
  const [sheetOpen, setSheetOpen] = useState(true);
  // Height (px) the phone sheet was dragged to; null = the default height.
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; startHeight: number; height: number; moved: boolean } | null>(null);

  // Drag the handle to any height between "just the handle" and nearly
  // full screen (a strip of map always stays visible). The height is
  // written straight to a CSS variable while dragging so it tracks the
  // finger without re-rendering; a tap without movement hides/shows it.
  function sheetLimits() {
    const handle = sheetRef.current?.querySelector<HTMLElement>(".explorer-sheet-handle");
    const min = handle?.offsetHeight ?? 44;
    const max = window.innerHeight - 64 - 96; // header, then keep ~6rem of map
    return { min, max: Math.max(min, max) };
  }
  function onHandleDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const { min } = sheetLimits();
    const startHeight = sheetOpen ? sheet.getBoundingClientRect().height : min;
    drag.current = { startY: event.clientY, startHeight, height: startHeight, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onHandleMove(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    const main = mainRef.current;
    if (!state || !main) return;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.abs(dy) < 6) return;
    state.moved = true;
    const { min, max } = sheetLimits();
    state.height = Math.min(max, Math.max(min, state.startHeight - dy));
    main.style.setProperty("--sheet-open", `${state.height}px`);
    main.classList.add("sheet-dragging");
  }
  function onHandleUp() {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    mainRef.current?.classList.remove("sheet-dragging");
    if (!state.moved) {
      setSheetOpen((open) => !open);
      return;
    }
    const { min } = sheetLimits();
    if (state.height <= min + 24) {
      // Dragged all the way down: collapse to the handle, remember the
      // previous height for the next "Show".
      mainRef.current?.style.setProperty("--sheet-open", sheetHeight ? `${sheetHeight}px` : "");
      setSheetOpen(false);
    } else {
      setSheetHeight(state.height);
      setSheetOpen(true);
    }
  }

  // A new item was selected (list, map pin or link): show its details and
  // get the list out of the way. Adjusting state during render on a changed
  // value is React's recommended alternative to an effect here.
  const [shownId, setShownId] = useState(activeId);
  if (shownId !== activeId) {
    setShownId(activeId);
    setSheetOpen(true);
  }
  useEffect(() => setExplorerListOpen(false), [activeId]);
  // Leaving the explorer (e.g. Home) must not leave the list "open".
  useEffect(() => () => setExplorerListOpen(false), []);

  return (
    <main
      ref={mainRef}
      style={sheetHeight ? ({ "--sheet-open": `${sheetHeight}px` } as CSSProperties) : undefined}
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

        <section
          ref={sheetRef}
          className="explorer-sheet order-1 flex min-h-0 min-w-0 flex-col gap-3 xl:order-none"
          aria-label={activeTitle ? `${kindLabel}: ${activeTitle}` : `${kindLabel} details`}
        >
          <button
            type="button"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSheetOpen((open) => !open);
              }
            }}
            aria-expanded={sheetOpen}
            aria-label={sheetOpen ? "Drag to resize details (tap to hide)" : "Show details (drag to resize)"}
            className="explorer-sheet-handle relative flex w-full shrink-0 cursor-grab touch-none select-none flex-col items-center justify-center gap-1 px-4 lg:hidden"
          >
            <span className="h-1 w-10 rounded-full bg-foreground/25" aria-hidden />
            {sheetOpen ? (
              <span className="flex items-center gap-1 text-sm font-bold text-primary">
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                Drag
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              </span>
            ) : (
              <span className="text-sm font-bold text-primary">Show</span>
            )}
          </button>
          <div className="explorer-sheet-body flex min-h-0 flex-col gap-3">{children}</div>
        </section>

        <div className="explorer-drawer order-3 min-w-0 xl:order-none">
          {/* Quick switch: Home, or swap the list between videos and photos */}
          <div className="mb-3 flex items-center">
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

      {/* Phone backdrop behind the list */}
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
