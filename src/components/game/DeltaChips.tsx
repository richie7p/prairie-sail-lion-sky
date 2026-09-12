import { STAT_LABEL } from "@/lib/game/content";
import { formatDelta } from "@/lib/game/engine";
import type { Deltas, StatId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function DeltaChips({ deltas }: { deltas: Deltas }) {
  const keys = (Object.keys(deltas) as StatId[]).filter((k) => (deltas[k] ?? 0) !== 0);
  if (keys.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => {
        const v = deltas[k] ?? 0;
        const good =
          k === "stress" || k === "stamina"
            ? k === "stress"
              ? v < 0
              : v > 0
            : v > 0;
        const bad = !good && v !== 0;
        return (
          <span
            key={k}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums",
              good && "bg-ok/15 text-ok",
              bad && "bg-danger/15 text-danger",
            )}
          >
            {STAT_LABEL[k]} {formatDelta(k, v)}
          </span>
        );
      })}
    </div>
  );
}
