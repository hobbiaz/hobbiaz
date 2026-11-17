"use client";

import { useEffect, useState } from "react";

/** Matches the legacy `window.innerWidth <= 900` mobile breakpoint by default. */
export function useMediaQuery(query = "(max-width: 900px)") {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 900px)");
