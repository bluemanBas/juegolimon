"use client";

import { ROLE_INFO } from "@/lib/engine/constants";
import type { EventImpactRow } from "@/lib/engine/analytics";

interface EventTimelineProps {
  events: EventImpactRow[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-lg font-bold text-earth-800 mb-2">
          Linea de Tiempo de Eventos
        </h3>
        <p className="text-earth-400 text-sm">
          No ocurrieron eventos aleatorios en esta partida.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-earth-800 mb-4">
        Linea de Tiempo de Eventos
      </h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-earth-200" />

        <div className="space-y-4">
          {events.map((evt, idx) => {
            const roleInfo = ROLE_INFO[evt.targetRole];
            return (
              <div key={idx} className="flex items-start gap-4 relative">
                {/* Dot on timeline */}
                <div className="w-12 flex-shrink-0 flex flex-col items-center">
                  <span className="text-xs font-bold text-earth-500 mb-1">
                    S{evt.week}
                  </span>
                  <span className="text-xl z-10 bg-white">{evt.emoji}</span>
                </div>

                {/* Content */}
                <div className="bg-earth-50 rounded-lg p-3 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-earth-700">
                      {evt.description}
                    </span>
                  </div>
                  <span className="text-xs text-earth-400">
                    Afecta a: {roleInfo.emoji} {roleInfo.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
