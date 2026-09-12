import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeltaChips } from "@/components/game/DeltaChips";
import { ResourceRow } from "@/components/game/StatMeter";
import { ACHIEVEMENTS, ARCHETYPES, PHASES } from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { toast } from "sonner";

export function RecapScreen() {
  const data = useGame((s) => s.data);
  const next = useGame((s) => s.next);
  const recap = data.recap;
  if (!recap) return null;
  const phase = PHASES[recap.phase]!;
  const roommate = data.roommate;

  const onNext = () => {
    const ids = next();
    ids.forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) toast(`成就：${a.name}`);
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
      <p className="text-xs tracking-widest text-muted uppercase">{phase.label}</p>
      <h1 className="mt-2 font-display text-4xl text-fg">{recap.title}</h1>
      <p className="mt-3 text-sm text-muted">{recap.body}</p>
      <ul className="mt-6 space-y-2">
        {recap.notes.map((n) => (
          <li key={n} className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg">
            {n}
          </li>
        ))}
      </ul>
      {roommate && recap.roommateNote ? (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs tracking-widest text-muted uppercase">室友這學期</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-fg">{roommate.name}</p>
            <Badge>{ARCHETYPES[roommate.archetype].name}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">{recap.roommateNote}</p>
          <p className="mt-2 text-xs text-faint">
            GPA {roommate.stats.gpa.toFixed(2)}
            {roommate.hasAdvisor ? " · 進實驗室" : ""}
            {roommate.internDone ? " · 有實習" : ""}
            {roommate.papers > 0 ? ` · 論文 ${roommate.papers}` : ""}
          </p>
        </div>
      ) : null}
      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs text-muted">學期結算變化</p>
        <DeltaChips deltas={recap.deltas} />
        <div className="mt-4">
          <ResourceRow stats={data.stats} />
        </div>
      </div>
      <Button size="lg" className="mt-8" onClick={onNext}>
        {recap.nextLabel}
      </Button>
    </div>
  );
}
