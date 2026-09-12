import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceRow, StatMeter } from "@/components/game/StatMeter";
import {
  ACHIEVEMENTS,
  ADVISOR_TRACK,
  ARCHETYPES,
  EVIDENCE,
  INTERN_TRACK,
  MAJORS,
  PROJECT_TRACK,
  VERDICT_LABEL,
} from "@/lib/game/content";
import { examTrackScore, roommateScore } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import type { RunRecord, StatId, Verdict } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const VERDICT_VARIANT: Record<Verdict, "ok" | "warn" | "danger" | "default"> = {
  likely: "ok",
  possible: "warn",
  risk: "danger",
  low: "default",
};

const DETAIL: StatId[] = [
  "english",
  "coding",
  "research",
  "project",
  "papers",
  "certs",
  "network",
];

function band(score: number): Verdict {
  if (score >= 74) return "likely";
  if (score >= 60) return "possible";
  if (score >= 48) return "risk";
  return "low";
}

function routeLabel(run: Pick<RunRecord, "advisorTrack" | "internTrack" | "projectTrack">) {
  const bits: string[] = [];
  if (run.advisorTrack !== "none") bits.push(ADVISOR_TRACK[run.advisorTrack].badge);
  if (run.projectTrack !== "none") bits.push(PROJECT_TRACK[run.projectTrack].badge);
  if (run.internTrack !== "none") bits.push(INTERN_TRACK[run.internTrack].badge);
  return bits.join(" · ") || "沒有定型路線";
}

export function ResultScreen() {
  const data = useGame((s) => s.data);
  const goCreate = useGame((s) => s.goCreate);
  const toTitle = useGame((s) => s.toTitle);
  const profile = data.profile!;
  const schools = data.admission ?? [];
  const best = schools[0];
  const unlocked = ACHIEVEMENTS.filter((a) => data.achievements.includes(a.id));
  const track = data.flags.advisorTrack;
  const picks = data.dossier
    .map((id) => EVIDENCE.find((e) => e.id === id)?.name)
    .filter(Boolean);
  const iv = data.interview;
  const mate = data.roommate;
  const mateBest = roommateScore(data);
  const exam = examTrackScore(data);
  const examVerdict = band(exam);
  const myBest = best?.score ?? 0;
  const examBetter =
    best && (best.verdict === "risk" || best.verdict === "low") && exam > myBest + 4;
  const attr = data.attribution;
  const prev = data.history[1];
  const currentRun = data.history[0];

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs tracking-widest text-muted uppercase">推甄季 · 書審估算</p>
      <h1 className="mt-2 font-display text-4xl text-fg">委員會只看證據</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        {profile.name} · {MAJORS[profile.major].name}。以下適配度是遊戲內估算，用能力權重模擬各所口味，
        <span className="text-fg"> 不是真實錄取預測</span>。
      </p>

      {best ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-muted">
            {best.verdict === "likely" || best.verdict === "possible"
              ? "目前最接近的目標（估算）"
              : "沒有明顯穩的所。相對最接近的是（估算）"}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-fg">{best.short}</h2>
            <div className="flex flex-wrap gap-1.5">
              {best.interviewed ? <Badge variant="ok">口試過</Badge> : null}
              <Badge variant={VERDICT_VARIANT[best.verdict]}>{VERDICT_LABEL[best.verdict]}</Badge>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">{best.comment}</p>
          {iv && best.interviewed ? (
            <p className="mt-2 text-xs text-faint">
              口試印象 {iv.totalDelta > 0 ? "+" : ""}
              {iv.totalDelta} · 估算
            </p>
          ) : (
            <p className="mt-2 text-xs text-faint">書審沒過線，沒進面試。</p>
          )}
          <p className="mt-3 font-mono text-xs tabular-nums text-faint">適配 {best.score} / 100 · 估算</p>
        </div>
      ) : null}

      {picks.length > 0 ? (
        <p className="mt-4 text-xs text-muted">
          書審放了：{picks.join("、")}
          {track !== "none" ? ` · ${ADVISOR_TRACK[track].badge}` : ""}
          {data.flags.projectTrack !== "none" ? ` · ${PROJECT_TRACK[data.flags.projectTrack].badge}` : ""}
          {data.flags.internTrack !== "none" ? ` · ${INTERN_TRACK[data.flags.internTrack].badge}` : ""}
        </p>
      ) : null}

      {attr ? (
        <section className="mt-6 rounded-xl border border-border bg-surface p-5">
          <p className="text-xs tracking-widest text-muted uppercase">這次結果怎麼來的 · 估算</p>
          <ul className="mt-4 space-y-3">
            {attr.lines.map((line) => (
              <li key={line.label}>
                <p className="text-xs text-faint">{line.label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-fg">{line.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">{attr.roommateNote}</p>
          <p className="mt-3 text-sm leading-relaxed text-fg">{attr.nextTry}</p>
        </section>
      ) : null}

      {prev && currentRun ? (
        <section className="mt-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-xs tracking-widest text-muted uppercase">跟上輪比</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-faint">這一輪</p>
              <p className="mt-1 text-sm text-fg">
                {currentRun.bestShort} {currentRun.bestScore}
              </p>
              <p className="mt-1 text-xs text-muted">{routeLabel(currentRun)}</p>
            </div>
            <div>
              <p className="text-xs text-faint">上一輪 · {prev.name}</p>
              <p className="mt-1 text-sm text-fg">
                {prev.bestShort} {prev.bestScore}
              </p>
              <p className="mt-1 text-xs text-muted">{routeLabel(prev)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            {currentRun.bestScore > prev.bestScore
              ? `適配高了 ${currentRun.bestScore - prev.bestScore} 分。`
              : currentRun.bestScore < prev.bestScore
                ? `適配低了 ${prev.bestScore - currentRun.bestScore} 分。`
                : "兩輪適配打平。"}
            路線不同，分數才能拿來驗證策略。
          </p>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-fg">{profile.name} 的四年</p>
          <div className="mt-4">
            <ResourceRow stats={data.stats} />
          </div>
          <div className="mt-4 grid gap-3">
            {DETAIL.map((id) => (
              <StatMeter key={id} id={id} stats={data.stats} compact />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {track !== "none" ? (
              <Badge variant="ok">{ADVISOR_TRACK[track].badge}</Badge>
            ) : data.flags.hasAdvisor ? (
              <Badge variant="ok">指導教授</Badge>
            ) : null}
            {data.flags.internDone ? <Badge variant="ok">實習</Badge> : null}
            {data.flags.burnoutCount > 0 ? (
              <Badge variant="danger">過勞 {data.flags.burnoutCount}</Badge>
            ) : null}
          </div>
        </aside>

        <section className="space-y-2">
          {schools.map((school) => (
            <article
              key={school.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-fg">{school.name}</p>
                  <p className="mt-0.5 text-[11px] text-faint">{school.track}取向</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {school.interviewed ? <Badge variant="ok">口試</Badge> : null}
                  <Badge variant={VERDICT_VARIANT[school.verdict]}>
                    {VERDICT_LABEL[school.verdict]}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full",
                    school.verdict === "likely"
                      ? "bg-ok"
                      : school.verdict === "possible"
                        ? "bg-primary"
                        : school.verdict === "risk"
                          ? "bg-warn"
                          : "bg-muted",
                  )}
                  style={{ width: `${school.score}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-muted">{school.comment}</p>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-faint">
                  {school.score} · 估算
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>

      {mate && mateBest !== null ? (
        <section className="mt-8 rounded-xl border border-border bg-surface p-5">
          <p className="text-xs tracking-widest text-muted uppercase">室友對照 · 估算</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-fg">{mate.name}</h2>
              <p className="mt-1 text-xs text-muted">{ARCHETYPES[mate.archetype].name}</p>
            </div>
            <p className="font-mono text-xs tabular-nums text-faint">
              你 {myBest} · 室友 {mateBest}
            </p>
          </div>
          <p className="mt-3 text-sm text-muted">
            {myBest > mateBest
              ? "這輪你壓過室友。"
              : myBest < mateBest
                ? "室友這輪比較像委員會要的形狀。"
                : "打平。"}
            室友沒有組書審、也沒進面試。
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-faint">GPA</dt>
              <dd className="mt-1 font-mono tabular-nums text-fg">
                {data.stats.gpa.toFixed(2)} / {mate.stats.gpa.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-faint">論文</dt>
              <dd className="mt-1 font-mono tabular-nums text-fg">
                {data.stats.papers} / {mate.papers}
              </dd>
            </div>
            <div>
              <dt className="text-faint">實習</dt>
              <dd className="mt-1 text-fg">
                {data.flags.internDone ? "有" : "無"} / {mate.internDone ? "有" : "無"}
              </dd>
            </div>
            <div>
              <dt className="text-faint">實驗室</dt>
              <dd className="mt-1 text-fg">
                {data.flags.hasAdvisor ? "有" : "無"} / {mate.hasAdvisor ? "有" : "無"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-muted uppercase">考試入學備案 · 估算</p>
            <h2 className="mt-2 font-display text-2xl text-fg">同一張成績單的另一條路</h2>
          </div>
          <Badge variant={VERDICT_VARIANT[examVerdict]}>{VERDICT_LABEL[examVerdict]}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {examBetter
            ? "這輪推甄偏危險，考試入學備案看起來比較穩。筆試吃 GPA、英文、程式，跟書審口味不完全一樣。"
            : "偏 GPA、英文、程式。推甄若落空，這條路還在。"}
        </p>
        <p className="mt-3 font-mono text-xs tabular-nums text-faint">筆試適配 {exam} / 100 · 估算</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xs tracking-widest text-muted uppercase">成就</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const on = unlocked.some((u) => u.id === a.id);
            return (
              <li
                key={a.id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  on ? "border-border bg-surface" : "border-border/60 opacity-40",
                )}
              >
                <p className="text-sm text-fg">{a.name}</p>
                <p className="mt-1 text-xs text-muted">{a.blurb}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={goCreate}>
          再來一輪
        </Button>
        <Button size="lg" variant="secondary" onClick={toTitle}>
          回到標題
        </Button>
      </div>
    </div>
  );
}
