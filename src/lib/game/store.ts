import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  advanceSemester,
  answerInterview,
  dismissEvent,
  hasContinue,
  normalizeSave,
  performAction,
  replaceEvidence,
  resolveInterviewOption,
  resumeScreen,
  startGame,
  submitDossier,
  titleData,
  toggleEvidence,
} from "./engine";
import type { ActionId, EvidenceId, GameData, Profile } from "./types";
import { SAVE_VERSION } from "./types";

interface GameStore {
  data: GameData;
  goCreate: () => void;
  start: (profile: Profile) => void;
  act: (id: ActionId) => string[];
  dismiss: () => void;
  next: () => string[];
  toggleDoc: (id: EvidenceId) => { full: boolean };
  replaceDoc: (outId: EvidenceId, inId: EvidenceId) => void;
  submitDoc: () => string[];
  answer: (optionIndex: number) => {
    reply: string;
    delta: number;
    supported: boolean;
    names: string[];
  };
  toTitle: () => void;
  resume: () => void;
  abandon: () => void;
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      data: titleData(),
      goCreate: () =>
        set((s) => ({
          data: { ...s.data, screen: "create" },
        })),
      start: (profile) => set({ data: startGame(profile, get().data.history) }),
      act: (id) => {
        const { data, unlocked } = performAction(get().data, id);
        set({ data });
        return unlocked.map((u) => u.name);
      },
      dismiss: () => set({ data: dismissEvent(get().data) }),
      next: () => {
        const before = get().data.achievements;
        const data = advanceSemester(get().data);
        set({ data });
        return data.achievements.filter((id) => !before.includes(id));
      },
      toggleDoc: (id) => {
        const cur = get().data;
        if (!cur.dossier.includes(id) && cur.dossier.length >= 3) {
          return { full: true };
        }
        set({ data: toggleEvidence(cur, id) });
        return { full: false };
      },
      replaceDoc: (outId, inId) => set({ data: replaceEvidence(get().data, outId, inId) }),
      submitDoc: () => {
        const before = get().data.achievements;
        const data = submitDossier(get().data);
        set({ data });
        return data.achievements.filter((id) => !before.includes(id));
      },
      answer: (optionIndex) => {
        const beforeData = get().data;
        const iv = beforeData.interview;
        const opt = iv?.questions[iv.index]?.options[optionIndex];
        const resolved = opt
          ? resolveInterviewOption(beforeData, opt)
          : { reply: "", delta: 0, supported: true };
        const before = beforeData.achievements;
        const data = answerInterview(beforeData, optionIndex);
        set({ data });
        return {
          reply: resolved.reply,
          delta: resolved.delta,
          supported: resolved.supported,
          names: data.achievements.filter((id) => !before.includes(id)),
        };
      },
      toTitle: () =>
        set((s) => ({
          data: { ...s.data, screen: "title" },
        })),
      resume: () =>
        set((s) => ({
          data: { ...s.data, screen: resumeScreen(s.data) },
        })),
      abandon: () => set({ data: titleData(get().data.history) }),
    }),
    {
      name: "tuijian-rpg-v1",
      version: SAVE_VERSION,
      partialize: (s) => ({ data: s.data }),
      skipHydration: true,
      migrate: (persisted) => {
        const p = persisted as { data?: GameData } | undefined;
        return { data: normalizeSave(p?.data) };
      },
      merge: (persisted, current) => {
        const p = persisted as { data?: GameData } | undefined;
        return { ...current, data: normalizeSave(p?.data) };
      },
    },
  ),
);

export function useHasSave() {
  return hasContinue(useGame((s) => s.data));
}
