import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ARCHETYPES, MAJORS } from "@/lib/game/content";
import type { ArchetypeId, MajorId } from "@/lib/game/types";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

const MAJOR_IDS = Object.keys(MAJORS) as MajorId[];
const ARCH_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

export function CreateScreen() {
  const start = useGame((s) => s.start);
  const toTitle = useGame((s) => s.toTitle);
  const [name, setName] = useState("");
  const [major, setMajor] = useState<MajorId>("cs");
  const [archetype, setArchetype] = useState<ArchetypeId>("balanced");

  const ready = name.trim().length >= 1;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-5 py-8 sm:px-8">
      <button
        type="button"
        onClick={toTitle}
        className="text-xs tracking-widest text-muted uppercase hover:text-fg"
      >
        返回
      </button>

      <header className="mt-8 max-w-lg">
        <p className="text-sm text-muted">角色建立</p>
        <h1 className="mt-2 font-display text-4xl text-fg">四年從這裡開始</h1>
        <p className="mt-3 text-sm text-muted">
          起始能力只決定開局，後面全靠每學期那三步。入學後會抽一位走相反傾向的室友。
        </p>
      </header>

      <label className="mt-8 block max-w-sm">
        <span className="mb-2 block text-xs text-muted">名字</span>
        <Input
          value={name}
          maxLength={12}
          placeholder="例如：林予安"
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </label>

      <section className="mt-8">
        <h2 className="text-xs tracking-widest text-muted uppercase">學系</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MAJOR_IDS.map((id) => {
            const m = MAJORS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMajor(id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                  major === id
                    ? "border-primary bg-surface-2"
                    : "border-border bg-surface hover:border-muted",
                )}
              >
                <p className="text-sm font-medium text-fg">{m.name}</p>
                <p className="mt-1 text-xs text-muted">{m.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xs tracking-widest text-muted uppercase">開局傾向</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ARCH_IDS.map((id) => {
            const a = ARCHETYPES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setArchetype(id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                  archetype === id
                    ? "border-primary bg-surface-2"
                    : "border-border bg-surface hover:border-muted",
                )}
              >
                <p className="text-sm font-medium text-fg">{a.name}</p>
                <p className="mt-1 text-xs text-muted">{a.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          disabled={!ready}
          onClick={() => start({ name: name.trim(), major, archetype })}
        >
          進入大一上
        </Button>
        <p className="text-xs text-faint">進度會存在這個瀏覽器。沒有登入。</p>
      </div>
    </div>
  );
}
