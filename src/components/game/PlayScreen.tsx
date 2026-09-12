import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Cpu,
  FileText,
  FolderKanban,
  Languages,
  Moon,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DeltaChips } from "@/components/game/DeltaChips";
import { EventOverlay } from "@/components/game/EventOverlay";
import { ResourceRow, StatMeter } from "@/components/game/StatMeter";
import {
  ACTION_MAP,
  ACTIONS,
  ADVISOR_TRACK,
  ARCHETYPES,
  INTERN_TRACK,
  MAJORS,
  PHASES,
  PROJECT_TRACK,
  STAT_LABEL,
} from "@/lib/game/content";
import { actionForecast, actionLockReason } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import type { ActionId, StatId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ActionId, typeof BookOpen> = {
  gpa: BookOpen,
  project: FolderKanban,
  submit: FileText,
  english: Languages,
  cert: BadgeCheck,
  hackathon: Cpu,
  advisor: UserRoundSearch,
  intern: Briefcase,
  rest: Moon,
};

const DETAIL_STATS: StatId[] = [
  "english",
  "coding",
  "research",
  "project",
  "papers",
  "certs",
  "network",
];

export function PlayScreen() {
  const data = useGame((s) => s.data);
  const act = useGame((s) => s.act);
  const dismiss = useGame((s) => s.dismiss);
  const toTitle = useGame((s) => s.toTitle);
  const profile = data.profile!;
  const phase = PHASES[data.phase]!;
  const major = MAJORS[profile.major];
  const arch = ARCHETYPES[profile.archetype];
  const roommate = data.roommate;
  const track = data.flags.advisorTrack;
  const projectTrack = data.flags.projectTrack;
  const internTrack = data.flags.internTrack;
  const termJournal = data.journal.filter((j) => j.phase === data.phase).slice(0, 8);

  const onAct = (id: ActionId) => {
    const names = act(id);
    names.forEach((n) => toast(`成就：${n}`));
  };

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-4 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toTitle}
          className="text-xs tracking-widest text-muted uppercase hover:text-fg"
        >
          推甄養成
        </button>
        <div className="flex items-center gap-2">
          <Badge>{phase.label}</Badge>
          <Badge variant="solid">剩餘 {data.actionsLeft} 行動</Badge>
        </div>
      </header>

      <ol className="mt-3 flex gap-1">
        {PHASES.slice(0, 7).map((p) => (
          <li key={p.id} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full",
                p.id < data.phase ? "bg-primary" : p.id === data.phase ? "bg-ok" : "bg-surface-2",
              )}
            />
            <p
              className={cn(
                "mt-1 hidden text-center text-xs sm:block",
                p.id === data.phase ? "text-fg" : "text-faint",
              )}
            >
              {p.label}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md bg-surface-2 font-display text-lg text-fg">
                {profile.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg">{profile.name}</p>
                <p className="text-xs text-muted">
                  {major.name} · {arch.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {track !== "none" ? (
                  <Badge variant="ok">{ADVISOR_TRACK[track].badge}</Badge>
                ) : data.flags.hasAdvisor ? (
                  <Badge variant="ok">有指導教授</Badge>
                ) : null}
                {projectTrack !== "none" ? (
                  <Badge variant="ok">{PROJECT_TRACK[projectTrack].badge}</Badge>
                ) : null}
                {internTrack !== "none" ? (
                  <Badge variant="ok">{INTERN_TRACK[internTrack].badge}</Badge>
                ) : data.flags.internDone ? (
                  <Badge variant="ok">有實習</Badge>
                ) : null}
                {data.stats.papers > 0 ? (
                  <Badge variant="ok">論文 {data.stats.papers}</Badge>
                ) : null}
                {data.stats.stress >= 80 ? <Badge variant="danger">過勞風險</Badge> : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">{phase.blurb}</p>
            {track !== "none" ? (
              <p className="mt-1 text-xs text-faint">{ADVISOR_TRACK[track].blurb}</p>
            ) : null}
            <div className="mt-4">
              <ResourceRow stats={data.stats} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {DETAIL_STATS.map((id) => (
                <StatMeter key={id} id={id} stats={data.stats} compact />
              ))}
            </div>
          </section>

          <div className="mt-4 mb-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-fg">{phase.label}</h1>
              <p className="mt-1 text-xs text-muted">選一個行動。點下去就執行，沒有後悔鍵。</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {ACTIONS.map((action) => {
              const lock = actionLockReason(data, action.id);
              const Icon = ICONS[action.id];
              const forecast = actionForecast(data, action.id);
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={Boolean(lock)}
                  onClick={() => onAct(action.id)}
                  className={cn(
                    "min-h-11 rounded-lg border border-border bg-surface px-3 py-3 text-left transition-colors duration-150",
                    lock ? "opacity-45" : "hover:border-muted hover:bg-surface-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                      <span className="text-sm font-medium text-fg">{action.name}</span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-faint">
                      {action.staminaCost === 0 ? "不耗體力" : `體力 ${action.staminaCost}`}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                    {lock ?? action.blurb}
                  </p>
                  {!lock ? (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                      {forecast.growth}
                      <span className="text-muted"> · {forecast.stress}</span>
                      {forecast.risk ? (
                        <span className="block text-warn">{forecast.risk}</span>
                      ) : null}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          {roommate ? (
            <section className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs tracking-widest text-muted uppercase">室友</p>
              <p className="mt-2 text-sm font-medium text-fg">{roommate.name}</p>
              <p className="text-xs text-muted">{ARCHETYPES[roommate.archetype].name}</p>
              <p className="mt-2 text-xs leading-relaxed text-faint">
                {roommate.lastActions.length
                  ? `上學期：${roommate.lastActions.map((id) => ACTION_MAP[id].name).join("、")}`
                  : "同寢。這學期才剛搬進來。"}
              </p>
              <p className="mt-2 font-mono text-[11px] tabular-nums text-muted">
                GPA {roommate.stats.gpa.toFixed(2)}
                {roommate.papers > 0 ? ` · 論文 ${roommate.papers}` : ""}
                {roommate.hasAdvisor ? " · 實驗室" : ""}
                {roommate.internDone ? " · 實習" : ""}
              </p>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-xs tracking-widest text-muted uppercase">學期日誌</h2>
            <ul className="mt-3 space-y-3">
              {termJournal.length === 0 ? (
                <li className="text-xs text-faint">還沒做事。選一個行動開始這個學期。</li>
              ) : (
                termJournal.map((j) => (
                  <li key={j.id} className="border-b border-border pb-3 last:border-0">
                    <p className="text-sm text-fg">{j.title}</p>
                    <div className="mt-1.5">
                      <DeltaChips deltas={j.deltas} />
                    </div>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-faint">
              {STAT_LABEL.stress}過高會降低效率，甚至強制當機。投稿與證照都可能失敗。
            </p>
          </section>
        </aside>
      </div>

      {data.pendingEvent ? (
        <EventOverlay event={data.pendingEvent} onDismiss={dismiss} />
      ) : null}
    </div>
  );
}
