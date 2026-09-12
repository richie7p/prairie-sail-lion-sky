import { Button } from "@/components/ui/button";
import { DeltaChips } from "@/components/game/DeltaChips";
import type { GameEvent } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const TONE_BAR: Record<GameEvent["tone"], string> = {
  good: "bg-ok",
  bad: "bg-danger",
  mixed: "bg-warn",
  calm: "bg-muted",
};

export function EventOverlay({
  event,
  onDismiss,
}: {
  event: GameEvent;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
    >
      <div className="pop-in w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className={cn("h-1 w-full", TONE_BAR[event.tone])} />
        <div className="p-5 sm:p-6">
          <p className="text-[11px] tracking-widest text-muted uppercase">{event.kicker}</p>
          <h2 id="event-title" className="mt-2 font-display text-2xl text-fg">
            {event.title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{event.body}</p>
          <div className="mt-5">
            <DeltaChips deltas={event.deltas} />
          </div>
          <Button className="mt-6 w-full" onClick={onDismiss}>
            繼續
          </Button>
        </div>
      </div>
    </div>
  );
}
