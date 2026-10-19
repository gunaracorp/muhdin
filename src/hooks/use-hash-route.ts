"use client";

import { useEffect, useState, useCallback } from "react";

export function useHashRoute() {
  const read = useCallback(() => {
    const raw = window.location.hash.replace(/^#\/?/, "");
    return raw.split("/").filter(Boolean);
  }, []);

  const [segments, setSegments] = useState<string[]>([]);

  useEffect(() => {
    const onChange = () => setSegments(read());
    onChange();
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [read]);

  return segments;
}

export function navigate(path: string) {
  const clean = path.replace(/^#?\/?/, "");
  window.location.hash = `#/${clean}`;
}

export function useScrollToTopOnRoute(deps: unknown[]) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
     
  }, deps);
}
