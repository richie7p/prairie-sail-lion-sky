import { ClipboardList, Clock3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ADVISOR_TRACK,
  ARCHETYPES,
  INTERN_TRACK,
  MAJORS,
  PROJECT_TRACK,
  VERDICT_LABEL,
} from "@/lib/game/content";
import { hasContinue } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import type { Verdict } from "@/lib/game/types";

const VERDICT_VARIANT: Record<Verdict, "ok" | "warn" | "danger" | "default"> = {
  likely: "ok",
  possible: "warn",
  risk: "danger",
  low: "default",
};

export function TitleScreen() {
  const data = useGame((s) => s.data);
  const goCreate = useGame((s) => s.goCreate);
  const resume = useGame((s) => s.resume);
  const canContinue = hasContinue(data);
  const history = data.history ?? [];

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col justify-between px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex items-center justify-between text-xs tracking-widest text-muted uppercase">
        <span>Taiwan · Undergrad RPG</span>
        <span>四年一戰</span>
      </header>

      <main className="rise-in max-w-xl py-10">
        <p className="mb-4 text-sm text-muted">從大一走到推甄季</p>
        <h1 className="font-display text-5xl leading-tight text-fg sm:text-6xl">推甄養成</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
          每學期只有三次行動。GPA、論文、實習、教授、英文，都在搶同一點體力。
          教授、專題、實習會定型，後面的書審與口試吃的是現場，不是氣勢。結果是遊戲內的
          <span className="text-fg"> 適配估算</span>
          ，不是錄取預測。
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={goCreate} className="min-w-44">
            建立角色
          </Button>
          {canContinue ? (
            <Button size="lg" variant="secondary" onClick={resume} className="min-w-44">
              繼續上次
            </Button>
          ) : null}
        </div>
      </main>

      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Clock3,
            title: "七個學期",
            body: "每學期三步。行動前看得到成長區間與失敗率。",
          },
          {
            icon: Users,
            title: "路線會定型",
            body: "教授、專題、實習各走一條。證據卡跟口試題跟著變。",
          },
          {
            icon: ClipboardList,
            title: "結局有原因",
            body: "書審、口試、室友對照會拆開講。歷次可以拿來驗證策略。",
          },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <item.icon className="mb-3 size-4 text-muted" strokeWidth={1.75} />
            <p className="text-sm font-medium text-fg">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ul>

      {history.length > 0 ? (
        <section className="mt-8">
          <p className="text-xs tracking-widest text-muted uppercase">歷次遊玩</p>
          <ul className="mt-3 space-y-2">
            {history.map((run) => {
              const bits: string[] = [];
              if (run.advisorTrack !== "none") bits.push(ADVISOR_TRACK[run.advisorTrack].badge);
              if (run.projectTrack !== "none") bits.push(PROJECT_TRACK[run.projectTrack].badge);
              if (run.internTrack !== "none") bits.push(INTERN_TRACK[run.internTrack].badge);
              return (
                <li
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">
                      {run.name} · {MAJORS[run.major].name} · {ARCHETYPES[run.archetype].name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {bits.join(" · ") || "沒有定型路線"}
                      {run.interviewed ? ` · 口試 ${run.interviewDelta > 0 ? "+" : ""}${run.interviewDelta}` : " · 沒進面試"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted">{run.bestShort}</span>
                    <Badge variant={VERDICT_VARIANT[run.verdict]}>{VERDICT_LABEL[run.verdict]}</Badge>
                    <span className="font-mono text-xs tabular-nums text-faint">{run.bestScore}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
