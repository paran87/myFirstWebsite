"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the phone list drawer on the video/photo pages is open. Shared so
 * the site header's ☰ button can open the explorer's list.
 */
let open = false;
const listeners = new Set<() => void>();

export function setExplorerListOpen(next: boolean) {
  if (next === open) return;
  open = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useExplorerListOpen() {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}
