"use client";

import { useState, useCallback } from "react";
import dayjs from "dayjs";

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const year = currentDate.year();
  const month = currentDate.month() + 1;
  const monthKey = currentDate.format("YYYY-MM");

  const goToPrevMonth = useCallback(() => {
    setCurrentDate((d) => d.subtract(1, "month"));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((d) => d.add(1, "month"));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(dayjs());
  }, []);

  return {
    currentDate,
    year,
    month,
    monthKey,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  };
}
