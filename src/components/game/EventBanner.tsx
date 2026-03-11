"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { EVENT_CONFIG } from "@/lib/engine/constants";
import type { GameEvent } from "@/lib/engine/types";

interface EventBannerProps {
  events: GameEvent[];
  week: number;
}

export default function EventBanner({ events, week }: EventBannerProps) {
  const toastedWeekRef = useRef<number>(-1);

  // Show toasts for new events
  useEffect(() => {
    if (events.length > 0 && week !== toastedWeekRef.current) {
      toastedWeekRef.current = week;
      for (const evt of events) {
        const config = EVENT_CONFIG[evt.event];
        toast.warning(`${config?.emoji || "⚠️"} ${evt.description}`, {
          duration: 6000,
        });
      }
    }
  }, [events, week]);

  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      {events.map((evt, idx) => {
        const config = EVENT_CONFIG[evt.event];
        return (
          <div
            key={idx}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 animate-in fade-in"
          >
            <span className="text-2xl flex-shrink-0">
              {config?.emoji || "⚠️"}
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {config?.name || evt.event}
              </p>
              <p className="text-sm text-amber-700">{evt.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
