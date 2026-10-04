import { useEffect } from "react";
import { StorageNotice } from "@/components/storage-notice";
import { createFileRoute } from "@tanstack/react-router";
import { CreateScreen } from "@/components/game/CreateScreen";
import { DossierScreen } from "@/components/game/DossierScreen";
import { InterviewScreen } from "@/components/game/InterviewScreen";
import { PlayScreen } from "@/components/game/PlayScreen";
import { RecapScreen } from "@/components/game/RecapScreen";
import { ResultScreen } from "@/components/game/ResultScreen";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const screen = useGame((s) => s.data.screen);

  useEffect(() => {
    void useGame.persist.rehydrate();
  }, []);

  return <>
    <StorageNotice />
    <p role="note" className="border-b border-border bg-surface px-4 py-2 text-xs text-muted">遊戲規則與院校權重未經校準；分數是情境適配度，不能用於真實升學決策。只填虛構暱稱。</p>
    <GameScreen screen={screen} />
  </>;
}

function GameScreen({ screen }: { screen: string }) {
  if (screen === "create") return <CreateScreen />;
  if (screen === "play") return <PlayScreen />;
  if (screen === "recap") return <RecapScreen />;
  if (screen === "dossier") return <DossierScreen />;
  if (screen === "interview") return <InterviewScreen />;
  if (screen === "result") return <ResultScreen />;
  return <TitleScreen />;
}
