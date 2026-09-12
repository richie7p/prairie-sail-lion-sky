import { STAT_LABEL } from "@/lib/game/content";
import { englishBand, gpaBand } from "@/lib/game/engine";
import type { StatId, Stats } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function ratio(id: StatId, stats: Stats) {
  if (id === "gpa") return (stats.gpa - 1.6) / (4.3 - 1.6);
  if (id === "papers") return stats.papers / 4;
  if (id === "certs") return stats.certs / 5;
  return stats[id] / 100;
}

function display(id: StatId, stats: Stats) {
  if (id === "gpa") return stats.gpa.toFixed(2);
  return String(Math.round(stats[id]));
}

function barClass(id: StatId, stats: Stats) {
  if (id === "stress") {
    if (stats.stress >= 80) return "bg-danger";
    if (stats.stress >= 60) return "bg-warn";
    return "bg-muted";
  }
  if (id === "stamina") {
    if (stats.stamina < 28) return "bg-danger";
    if (stats.stamina < 50) return "bg-warn";
    return "bg-primary";
  }
  if (id === "gpa") {
    if (stats.gpa >= 3.7) return "bg-ok";
    if (stats.gpa >= 3.3) return "bg-primary";
    return "bg-warn";
  }
  return "bg-primary";
}

export function StatMeter({
  id,
  stats,
  compact,
}: {
  id: StatId;
  stats: Stats;
  compact?: boolean;
}) {
  const r = Math.max(0, Math.min(1, ratio(id, stats)));
  const sub =
    id === "gpa" ? gpaBand(stats.gpa) : id === "english" ? englishBand(stats.english) : null;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">{STAT_LABEL[id]}</span>
        <span className="font-mono text-xs tabular-nums text-fg">
          {display(id, stats)}
          {sub && !compact ? (
            <span className="ml-1.5 text-faint">{sub}</span>
          ) : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full transition-[width] duration-200", barClass(id, stats))}
          style={{ width: `${r * 100}%` }}
        />
      </div>
    </div>
  );
}

export function ResourceRow({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatMeter id="gpa" stats={stats} compact />
      <StatMeter id="stress" stats={stats} compact />
      <StatMeter id="stamina" stats={stats} compact />
    </div>
  );
}
