import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACHIEVEMENTS } from "@/lib/game/content";
import { useGame } from "@/lib/game/store";
import { toast } from "sonner";

function impression(delta: number, started: boolean) {
  if (!started) return "委員剛坐下。";
  if (delta >= 6) return "委員看起來有在聽。";
  if (delta >= 2) return "氣氛還過得去。";
  if (delta <= -4) return "空氣有點乾。";
  return "還沒有明顯加分。";
}

export function InterviewScreen() {
  const data = useGame((s) => s.data);
  const answer = useGame((s) => s.answer);
  const toTitle = useGame((s) => s.toTitle);
  const iv = data.interview;
  if (!iv) return null;
  const q = iv.questions[iv.index];
  if (!q) return null;

  const onPick = (i: number) => {
    const res = answer(i);
    if (res.reply) toast(res.reply);
    res.names.forEach((id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) toast(`成就：${a.name}`);
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
      <button
        type="button"
        onClick={toTitle}
        className="self-start text-xs tracking-widest text-muted uppercase hover:text-fg"
      >
        推甄養成
      </button>
      <p className="mt-6 text-xs tracking-widest text-muted uppercase">面試 · 估算</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl text-fg">{iv.schoolShort}</h1>
        <Badge>
          {iv.index + 1} / {iv.questions.length}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-muted">
        三個答案都說得通，差在你有沒有現場。{impression(iv.totalDelta, iv.index > 0)}
      </p>
      <h2 className="mt-8 font-display text-2xl text-fg">{q.prompt}</h2>
      <div className="mt-6 flex flex-col gap-2">
        {q.options.map((opt, i) => (
          <Button
            key={opt.label}
            variant="secondary"
            className="h-auto min-h-11 whitespace-normal py-3 text-left"
            onClick={() => onPick(i)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
