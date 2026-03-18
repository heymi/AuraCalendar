"use client";

import { useState, useCallback } from "react";

export function useHighlight() {
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());

  const highlight = useCallback((dates: string[]) => {
    setHighlightedDates(new Set(dates));
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedDates(new Set());
  }, []);

  const isHighlighted = useCallback(
    (date: string) => highlightedDates.has(date),
    [highlightedDates]
  );

  return { highlightedDates, highlight, clearHighlight, isHighlighted };
}
