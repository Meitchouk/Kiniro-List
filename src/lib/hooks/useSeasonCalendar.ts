/**
 * Hook for managing season calendar data fetching and pagination
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSeason, getUpcomingSeason, getSeason } from "@/lib/api";
import type { MediaSeason } from "@/lib/types";

type CalendarType = "current" | "upcoming" | "specific";

interface UseSeasonCalendarOptions {
  type: CalendarType;
  year?: number;
  season?: MediaSeason;
  enabled?: boolean;
}

export function useSeasonCalendar({
  type,
  year,
  season,
  enabled = true,
}: UseSeasonCalendarOptions) {
  const [page, setPage] = useState(1);

  const queryKey =
    type === "specific" ? ["calendar-season", year, season, page] : [`calendar-${type}`, page];

  const queryFn = () => {
    switch (type) {
      case "current":
        return getCurrentSeason(page);
      case "upcoming":
        return getUpcomingSeason(page);
      case "specific":
        if (!year || !season) throw new Error("Year and season required for specific type");
        return getSeason(year, season, page);
    }
  };

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    ...query,
    page,
    setPage,
    handlePageChange,
  };
}
