"use client";

import { useEffect, type RefObject } from "react";

/** Calls `onOutside` for clicks outside every given element while `active` is true. */
export function useClickOutside(refs: RefObject<HTMLElement | null>[], onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (refs.every((r) => r.current && !r.current.contains(e.target as Node))) onOutside();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [refs, onOutside, active]);
}
