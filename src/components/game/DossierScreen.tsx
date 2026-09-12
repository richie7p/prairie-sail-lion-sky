import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACHIEVEMENTS, EVIDENCE, VERDICT_LABEL } from "@/lib/game/content";
import { evaluateAdmission, evidenceUnlocked } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EvidenceId, Verdict } from "@/lib/game/types";

const VERDICT_VARIANT: Record<Verdict, "ok" | "warn" | "danger" | "default"> = {
  likely: "ok",
  possible: "warn",
  risk: "danger",
  low: "default",
};

export function DossierScreen() {
  const data = useGame((s) => s.data);
  const toggleDoc = useGame((s) => s.toggleDoc);
  const replaceDoc = useGame((s) => s.replaceDoc);
  const submitDoc = useGame((s) => s.submitDoc);
  const toTitle = useGame((s) => s.toTitle);
  const picks = data.dossier;
  const preview = evaluateAdmission(data).slice(0, 3);
  const [swap, setSwap] = useState<EvidenceId | null>(null);
  const swapName = EVIDENCE.find((e) => e.id === swap)?.name;

  const onCard = (id: EvidenceId) => {
    const on = picks.includes(id);
    if (swap) {
      if (id === swap) {
        setSwap(null);
        return;
      }
      if (on) {
        replaceDoc(id, swap);
        toast(`換成${EVIDENCE.find((e) => e.id === swap)?.name}`);
        setSwap(null);
        return;
      }
      toast("請點已放的一張來換出");
      return;
    }
    if (on) {
      toggleDoc(id);
      return;
    }
    const res = toggleDoc(id);
    if (res.full) {
      setSwap(id);
      toast("請先點已放的一張來換成這張");
    }
  };

  const onSubmit = () => {
    const ids = submitDoc();
    ids.forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) toast(`成就：${a.name}`);
    });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-5 py-8 sm:px-8">
      <button
        type="button"
        onClick={toTitle}
        className="text-xs tracking-widest text-muted uppercase hover:text-fg"
      >
        推甄養成
      </button>
      <p className="mt-6 text-xs tracking-widest text-muted uppercase">推甄季 · 書審</p>
      <h1 className="mt-2 font-display text-4xl text-fg">只能放三樣</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        委員會不會把你四年做過的每件事讀完。選三張最能對到目標所口味的證據。這會改適配估算，不是錄取保證。
      </p>
      <p className="mt-3 text-xs text-faint">
        已選 {picks.length} / 3
        {swap ? ` · 點已放的一張，換成「${swapName}」` : picks.length >= 3 ? " · 再點第四張可替換" : ""}
      </p>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {EVIDENCE.map((ev) => {
          const open = evidenceUnlocked(data, ev.id);
          const on = picks.includes(ev.id);
          const pending = swap === ev.id;
          return (
            <li key={ev.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => onCard(ev.id)}
                className={cn(
                  "min-h-11 w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                  on ? "border-primary bg-surface-2" : "border-border bg-surface",
                  pending && "border-warn bg-surface-2",
                  swap && on && "ring-1 ring-warn/50",
                  !open && "opacity-40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-fg">{ev.name}</p>
                  {pending ? (
                    <Badge variant="warn">待換入</Badge>
                  ) : on ? (
                    <Badge variant={swap ? "warn" : "solid"}>{swap ? "點此換出" : "已放"}</Badge>
                  ) : (
                    <Badge>{ev.taste}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">{open ? ev.blurb : ev.empty}</p>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="mt-8 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs tracking-widest text-muted uppercase">目前前三 · 估算</p>
        <ul className="mt-3 space-y-2">
          {preview.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-fg">{s.short}</p>
                <p className="text-[11px] text-faint">{s.track}取向</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={VERDICT_VARIANT[s.verdict]}>{VERDICT_LABEL[s.verdict]}</Badge>
                <span className="font-mono text-xs tabular-nums text-faint">{s.score}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Button size="lg" className="mt-8" disabled={picks.length === 0} onClick={onSubmit}>
        {picks.length === 0 ? "至少放一張" : "送出書審"}
      </Button>
    </div>
  );
}
