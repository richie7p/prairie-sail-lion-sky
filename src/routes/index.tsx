import { useEffect } from "react";
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

  if (screen === "create") return <CreateScreen />;
  if (screen === "play") return <PlayScreen />;
  if (screen === "recap") return <RecapScreen />;
  if (screen === "dossier") return <DossierScreen />;
  if (screen === "interview") return <InterviewScreen />;
  if (screen === "result") return <ResultScreen />;
  return <TitleScreen />;
}
