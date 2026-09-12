import {
  ACHIEVEMENTS,
  ACTION_MAP,
  ACTIONS_PER_SEMESTER,
  ADVISOR_TRACK,
  ARCHETYPES,
  EVIDENCE,
  INTERN_TRACK,
  INTERVIEW_BANK,
  LAST_PLAY_PHASE,
  MAJORS,
  MAX_HISTORY,
  OPPOSITE_ARCHETYPE,
  PHASES,
  PROJECT_TRACK,
  RESULT_PHASE,
  ROOMMATE_NAMES,
  ROOMMATE_PREFS,
  ROUTE_QUESTIONS,
  SCHOOLS,
} from "./content";
import { createRng, type Rng } from "./rng";
import type {
  AchievementUnlock,
  ActionId,
  AdvisorTrack,
  Attribution,
  Deltas,
  EvidenceId,
  Flags,
  GameData,
  GameEvent,
  InternTrack,
  InterviewNeed,
  InterviewOption,
  InterviewQuestion,
  InterviewState,
  JournalEntry,
  Profile,
  ProjectTrack,
  RoommateState,
  RunRecord,
  SchoolResult,
  SemesterRecap,
  Stats,
  Tone,
  Verdict,
} from "./types";
import { SAVE_VERSION } from "./types";

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function emptyFlags(): Flags {
  return {
    hasAdvisor: false,
    internDone: false,
    internCount: 0,
    burnoutCount: 0,
    restCount: 0,
    hackathonCount: 0,
    paperAttempts: 0,
    gpaActionsThisTerm: 0,
    heavyThisTerm: 0,
    burnedThisTerm: false,
    actionCountsThisTerm: {},
    actionCounts: {},
    advisorTrack: "none",
    projectTrack: "none",
    internTrack: "none",
  };
}

export function defaultStats(): Stats {
  return {
    gpa: 3.3,
    english: 40,
    coding: 20,
    research: 10,
    project: 12,
    papers: 0,
    certs: 0,
    network: 20,
    stress: 24,
    stamina: 100,
  };
}

export function titleData(history: RunRecord[] = []): GameData {
  return {
    version: SAVE_VERSION,
    screen: "title",
    gameActive: false,
    profile: null,
    phase: 0,
    actionsLeft: ACTIONS_PER_SEMESTER,
    stats: defaultStats(),
    flags: emptyFlags(),
    journal: [],
    achievements: [],
    pendingEvent: null,
    recap: null,
    admission: null,
    roommate: null,
    dossier: [],
    interview: null,
    attribution: null,
    history,
    seed: 0,
    rngState: 0,
    turn: 0,
  };
}

export function mergeStats(base: Stats, mods: Partial<Stats>): Stats {
  const next = { ...base };
  (Object.keys(mods) as (keyof Stats)[]).forEach((k) => {
    const v = mods[k];
    if (v === undefined) return;
    next[k] = (next[k] as number) + v;
  });
  return clampStats(next);
}

export function clampStats(s: Stats): Stats {
  return {
    gpa: clamp(round2(s.gpa), 1.6, 4.3),
    english: clamp(Math.round(s.english), 0, 100),
    coding: clamp(Math.round(s.coding), 0, 100),
    research: clamp(Math.round(s.research), 0, 100),
    project: clamp(Math.round(s.project), 0, 100),
    papers: clamp(Math.round(s.papers), 0, 8),
    certs: clamp(Math.round(s.certs), 0, 10),
    network: clamp(Math.round(s.network), 0, 100),
    stress: clamp(Math.round(s.stress), 0, 100),
    stamina: clamp(Math.round(s.stamina), 0, 100),
  };
}

export function applyDeltas(stats: Stats, d: Deltas): Stats {
  return clampStats({
    gpa: stats.gpa + (d.gpa ?? 0),
    english: stats.english + (d.english ?? 0),
    coding: stats.coding + (d.coding ?? 0),
    research: stats.research + (d.research ?? 0),
    project: stats.project + (d.project ?? 0),
    papers: stats.papers + (d.papers ?? 0),
    certs: stats.certs + (d.certs ?? 0),
    network: stats.network + (d.network ?? 0),
    stress: stats.stress + (d.stress ?? 0),
    stamina: stats.stamina + (d.stamina ?? 0),
  });
}

export function diffStats(before: Stats, after: Stats): Deltas {
  const d: Deltas = {};
  (Object.keys(before) as (keyof Stats)[]).forEach((k) => {
    const delta = round2((after[k] as number) - (before[k] as number));
    if (delta !== 0) d[k] = delta;
  });
  return d;
}

export function efficiency(stress: number) {
  if (stress >= 92) return 0.48;
  if (stress >= 80) return 0.66;
  if (stress >= 64) return 0.82;
  if (stress >= 48) return 0.92;
  return 1;
}

export function gpaHeadroom(gpa: number) {
  return clamp((4.35 - gpa) / 1.85, 0.12, 1);
}

export function sameActionFactor(count: number) {
  if (count <= 1) return 1;
  return clamp(1 - 0.3 * (count - 1), 0.4, 1);
}

function weightedPick<T extends string>(rng: Rng, items: { id: T; w: number }[]): T {
  const floor = items.map((x) => ({ ...x, w: Math.max(1, x.w) }));
  const sum = floor.reduce((n, x) => n + x.w, 0);
  let roll = rng.next() * sum;
  for (const item of floor) {
    roll -= item.w;
    if (roll <= 0) return item.id;
  }
  return floor[0]!.id;
}

function pickAdvisorTrack(stats: Stats, rng: Rng): AdvisorTrack {
  return weightedPick(rng, [
    { id: "academic", w: stats.research * 1.2 + stats.papers * 18 },
    { id: "builder", w: stats.coding + stats.project },
    { id: "manager", w: stats.english + stats.network },
  ]);
}

function pickProjectTrack(data: GameData, rng: Rng): ProjectTrack {
  const s = data.stats;
  const a = data.flags.advisorTrack;
  return weightedPick(rng, [
    { id: "research", w: s.research + (a === "academic" ? 40 : 0) },
    { id: "product", w: s.coding + s.project + (a === "builder" ? 30 : 0) + data.flags.hackathonCount * 12 },
    { id: "data", w: s.english + s.network * 0.6 + (a === "manager" ? 30 : 0) },
  ]);
}

function pickInternTrack(data: GameData, rng: Rng): InternTrack {
  const s = data.stats;
  const a = data.flags.advisorTrack;
  return weightedPick(rng, [
    { id: "lab", w: s.research + (a === "academic" ? 50 : 0) },
    { id: "swe", w: s.coding + s.project + (a === "builder" ? 35 : 0) },
    { id: "pm", w: s.english + s.network + (a === "manager" ? 40 : 0) },
  ]);
}

export function makeRoommate(profile: Profile, seed: number): RoommateState {
  const rng = createRng(seed ^ 0x9e3779b9);
  const archetype = OPPOSITE_ARCHETYPE[profile.archetype];
  const stats = mergeStats(ARCHETYPES[archetype].stats, MAJORS[profile.major].mods);
  stats.stamina = 100;
  return {
    name: rng.pick([...ROOMMATE_NAMES]),
    archetype,
    stats,
    hasAdvisor: false,
    internDone: false,
    papers: 0,
    lastActions: [],
  };
}

function pickRoommateActions(r: RoommateState, phase: number, rng: Rng): ActionId[] {
  const prefs = ROOMMATE_PREFS[r.archetype].filter((id) => {
    if (id === "intern" && phase < 3) return false;
    if (id === "submit" && (r.stats.research < 26 || r.stats.project < 20)) return false;
    return true;
  });
  const pool = prefs.length ? prefs : (["gpa", "rest", "project"] as ActionId[]);
  const picks: ActionId[] = [];
  for (let i = 0; i < 3; i++) {
    picks.push(rng.pick(pool));
  }
  return picks;
}

function simRoommateTerm(r: RoommateState, phase: number, rng: Rng): RoommateState {
  const actions = pickRoommateActions(r, phase, rng);
  let stats = { ...r.stats };
  let hasAdvisor = r.hasAdvisor;
  let internDone = r.internDone;
  let papers = r.papers;
  for (const id of actions) {
    if (id === "gpa") stats.gpa += 0.07 * gpaHeadroom(stats.gpa);
    if (id === "project") {
      stats.project += 9;
      stats.research += 3;
      stats.coding += 2;
    }
    if (id === "submit") {
      stats.research += 4;
      if (rng.chance(0.32 + (hasAdvisor ? 0.18 : 0))) papers += 1;
    }
    if (id === "english") stats.english += 8;
    if (id === "cert") {
      stats.coding += 3;
      if (rng.chance(0.5)) stats.certs += 1;
    }
    if (id === "hackathon") {
      stats.coding += 9;
      stats.project += 4;
      stats.network += 6;
      stats.gpa -= 0.03;
    }
    if (id === "advisor") {
      stats.network += 7;
      stats.research += 4;
      if (!hasAdvisor && rng.chance(0.4 + phase * 0.06)) hasAdvisor = true;
    }
    if (id === "intern" && phase >= 3) {
      internDone = true;
      stats.coding += 8;
      stats.network += 8;
      stats.gpa -= 0.04;
    }
    if (id === "rest") {
      stats.stress -= 16;
      stats.stamina += 20;
    } else {
      stats.stress += 8;
      stats.stamina -= 18;
    }
  }
  stats.stress -= 6;
  stats.stamina = 90;
  return {
    ...r,
    stats: clampStats(stats),
    hasAdvisor,
    internDone,
    papers: clamp(papers, 0, 8),
    lastActions: actions,
  };
}

export function startGame(profile: Profile, history: RunRecord[] = []): GameData {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const arch = ARCHETYPES[profile.archetype];
  const major = MAJORS[profile.major];
  const stats = mergeStats(arch.stats, major.mods);
  stats.stamina = 100;
  return {
    version: SAVE_VERSION,
    screen: "play",
    gameActive: true,
    profile: { ...profile, name: profile.name.trim().slice(0, 12) },
    phase: 0,
    actionsLeft: ACTIONS_PER_SEMESTER,
    stats,
    flags: emptyFlags(),
    journal: [],
    achievements: [],
    pendingEvent: null,
    recap: null,
    admission: null,
    roommate: makeRoommate(profile, seed),
    dossier: [],
    interview: null,
    attribution: null,
    history,
    seed,
    rngState: seed,
    turn: 0,
  };
}

export function actionLockReason(data: GameData, id: ActionId): string | null {
  if (data.pendingEvent) return "先看完這張事件卡";
  if (data.actionsLeft <= 0) return "本學期行動已用完";
  const meta = ACTION_MAP[id];
  if (id !== "rest" && data.stats.stamina < meta.staminaCost) {
    return "體力不足，先休息";
  }
  if (id === "submit") {
    if (data.stats.research < 26 || data.stats.project < 20) {
      return "研究與專題火候未到";
    }
  }
  if (id === "intern" && data.phase < 3) {
    return "大二下之後才能實習";
  }
  return null;
}

export interface ActionForecast {
  growth: string;
  stress: string;
  risk: string | null;
}

export function submitChance(data: GameData) {
  const s = data.stats;
  const f = data.flags;
  return clamp(
    0.16 +
      (s.research / 100) * 0.32 +
      (s.project / 100) * 0.12 +
      (f.hasAdvisor ? 0.16 : 0) +
      Math.min(s.papers, 3) * 0.04 -
      (s.stress / 100) * 0.08,
    0.08,
    0.7,
  );
}

export function advisorChance(data: GameData) {
  const s = data.stats;
  return clamp(
    0.18 +
      s.research / 280 +
      s.project / 320 +
      s.network / 260 +
      (data.phase >= 3 ? 0.12 : 0) +
      (data.phase >= 5 ? 0.08 : 0),
    0.12,
    0.7,
  );
}

export function certChance(data: GameData) {
  const skill = Math.max(data.stats.coding, data.stats.english);
  return clamp(0.42 + skill / 220 - data.stats.stress / 400, 0.28, 0.78);
}

export function actionForecast(data: GameData, id: ActionId): ActionForecast {
  const s = data.stats;
  const f = data.flags;
  const eff = efficiency(s.stress);
  const count = (f.actionCountsThisTerm[id] ?? 0) + 1;
  const repeat = sameActionFactor(count);
  const mul = eff * repeat;
  const repeatNote = count > 1 ? " · 本學期重複，效益下降" : "";

  if (id === "gpa") {
    const lo = Math.max(0.03, round2(0.078 * gpaHeadroom(s.gpa) * mul));
    const hi = Math.max(0.04, round2(0.122 * gpaHeadroom(s.gpa) * mul));
    const explode = s.stress > 72 ? 28 : 8;
    return {
      growth: `GPA +${lo.toFixed(2)}～${hi.toFixed(2)}${repeatNote}`,
      stress: "壓力 +11～16",
      risk: `期中爆炸約 ${explode}%`,
    };
  }
  if (id === "project") {
    const lock =
      f.projectTrack === "none" && (f.actionCounts.project ?? 0) >= 1
        ? "這次可能定下專題方向"
        : f.projectTrack !== "none"
          ? PROJECT_TRACK[f.projectTrack].badge
          : "累積後解鎖專題作品";
    return {
      growth: `專題 +7～13 · 研究 +2～5${repeatNote}`,
      stress: "壓力 +10～16",
      risk: `Demo 翻車約 22% · ${lock}`,
    };
  }
  if (id === "submit") {
    const p = Math.round(submitChance(data) * 100);
    return {
      growth: `研究 +3～7 · 論文？${repeatNote}`,
      stress: "壓力 +10～20",
      risk: `接收率約 ${p}% · 格式退稿約 12%`,
    };
  }
  if (id === "english") {
    return {
      growth: `英文 +4～10${repeatNote}`,
      stress: "壓力 +6～10",
      risk: s.english >= 55 ? null : "55 以上才能當英文證明",
    };
  }
  if (id === "cert") {
    return {
      growth: `技能 +3～6 · 證照？${repeatNote}`,
      stress: "壓力 +10～16",
      risk: `通過率約 ${Math.round(certChance(data) * 100)}%`,
    };
  }
  if (id === "hackathon") {
    return {
      growth: `程式 +8～13 · 人脈 +5～10${repeatNote}`,
      stress: "壓力 +6～14 · GPA 微降",
      risk: "隊友消失約 18% · 佳作約 22%",
    };
  }
  if (id === "advisor") {
    if (f.hasAdvisor) {
      const badge = f.advisorTrack !== "none" ? ADVISOR_TRACK[f.advisorTrack].badge : "實驗室";
      return {
        growth: `研究 +4～7 · 人脈 +2～6${repeatNote}`,
        stress: "壓力 +5～9",
        risk: `${badge}續上，沒有收滿風險`,
      };
    }
    return {
      growth: `人脈 +5～10 · 研究 +3～6${repeatNote}`,
      stress: "壓力 +5～9",
      risk: `收下你的機率約 ${Math.round(advisorChance(data) * 100)}%`,
    };
  }
  if (id === "intern") {
    const flavor =
      f.internTrack !== "none"
        ? INTERN_TRACK[f.internTrack].badge
        : "第一次會依你現在的能力定型";
    return {
      growth: `程式 +6～11 · 人脈 +7～12${repeatNote}`,
      stress: "壓力 +12～16 · GPA 微降",
      risk: flavor,
    };
  }
  const over = s.stamina > 82 && s.stress < 28;
  return {
    growth: over ? "躺太徹底，回復會打折" : "體力 +36～48",
    stress: over ? "壓力只小降" : "壓力 -18～26",
    risk: over ? "過剩休息效益約四成" : null,
  };
}

function roundDelta(n: number) {
  return Math.round(n);
}

function scale(n: number, rng: Rng, spread = 0.18) {
  return n * (1 - spread + rng.next() * spread * 2);
}

interface ActionBuild {
  event: GameEvent;
  extraFlags?: Partial<Flags>;
}

function resolveAction(data: GameData, id: ActionId, rng: Rng): ActionBuild {
  const stats = data.stats;
  const flags = data.flags;
  const eff = efficiency(stats.stress);
  const count = (flags.actionCountsThisTerm[id] ?? 0) + 1;
  const repeat = sameActionFactor(count);
  const f = eff * repeat;
  const cost = ACTION_MAP[id].staminaCost;

  if (id !== "rest" && stats.stress >= 93 && !flags.burnedThisTerm) {
    return {
      event: {
        kicker: "過勞",
        title: "你在報告中間當機",
        body: "投影片還停在第三頁。同學把水遞給你，教授說先回去休息。這次沒能完成原定行動。",
        tone: "bad",
        deltas: { stamina: 22, stress: -20, gpa: -0.03 },
      },
      extraFlags: { burnoutCount: flags.burnoutCount + 1, burnedThisTerm: true },
    };
  }

  if (id === "gpa") {
    const gain = round2(scale(0.1, rng, 0.22) * gpaHeadroom(stats.gpa) * f);
    const stress = roundDelta(scale(13, rng, 0.15));
    if (stats.stress > 72 && rng.chance(0.28)) {
      return {
        event: {
          kicker: "期中",
          title: "期中考爆炸",
          body: "你以為範圍在第六章，出題教授顯然不同意。走廊上有人在哭，你選擇先去喝水。",
          tone: "bad",
          deltas: {
            gpa: -round2(0.04 + rng.range(0, 0.05)),
            stress: stress + 8,
            stamina: -cost,
            english: rng.chance(0.3) ? 1 : 0,
          },
        },
      };
    }
    const good = rng.pick([
      { title: "圖書館搶到靠窗座位", body: "插座、光線、安靜同時成立。你把考古題排成一條小型戰役，這次有打贏。" },
      { title: "這次範圍跟你重疊", body: "不是運氣好，是你把講義讀到能預測他愛考定義題。GPA 微幅上修。" },
      { title: "同學分享考古題", body: "你糾結了三秒還是自己寫完再對答案。群組很吵，成績單比較安靜。" },
      { title: "教授加了平時分", body: "點名、作業、那次你留下來問問題。成績不是只看期末那三小時。" },
    ]);
    return {
      event: {
        kicker: "成績",
        title: good.title,
        body: good.body,
        tone: "good",
        deltas: { gpa: Math.max(0.03, gain), stress, stamina: -cost, english: rng.chance(0.25) ? 1 : 0 },
      },
      extraFlags: { gpaActionsThisTerm: flags.gpaActionsThisTerm + 1 },
    };
  }

  if (id === "project") {
    const project = roundDelta(scale(11, rng) * f);
    const research = roundDelta(scale(4, rng) * f);
    const coding = roundDelta(scale(3, rng) * f);
    const lifetime = (flags.actionCounts.project ?? 0) + 1;
    const shouldLock = flags.projectTrack === "none" && lifetime >= 2;
    const nextTrack = shouldLock ? pickProjectTrack(data, rng) : flags.projectTrack;
    const extra: Partial<Flags> = {
      heavyThisTerm: flags.heavyThisTerm + 1,
      projectTrack: nextTrack,
    };
    if (rng.chance(0.22)) {
      return {
        event: {
          kicker: "專題",
          title: "Demo 當天投影片能開，程式不能",
          body: "你在講台上重啟了兩次。評審說「想法不錯」。這句話通常不是稱讚，但專題還是往前走了。",
          tone: "mixed",
          deltas: {
            project: Math.max(4, Math.round(project * 0.6)),
            research: Math.max(1, Math.round(research * 0.5)),
            coding: Math.max(1, coding),
            stress: roundDelta(scale(16, rng)),
            stamina: -cost,
          },
        },
        extraFlags: extra,
      };
    }
    if (shouldLock && nextTrack !== "none") {
      const lockLine =
        nextTrack === "research"
          ? "題目收成一個可以驗證的問題。這是研究型專題，之後比較能寫進研究紀錄。"
          : nextTrack === "product"
            ? "你把範圍砍到一個能 demo 的流程。這是作品型專題，實務所比較買帳。"
            : "你開始問資料從哪來、誰會用。這是資料型專題，均衡所比較好講。";
      return {
        event: {
          kicker: "專題定型",
          title: PROJECT_TRACK[nextTrack].badge,
          body: lockLine,
          tone: "good",
          deltas: { project: project + 2, research, coding, stress: roundDelta(scale(12, rng)), stamina: -cost },
        },
        extraFlags: extra,
      };
    }
    const byTrack =
      flags.projectTrack === "research"
        ? [
            { title: "實驗失敗你有把參數留下來", body: "同學只截成功的圖。你把失敗那一週也寫進紀錄，之後投稿比較不像憑空出現。" },
            { title: "指導把題目改窄了", body: "你原本想做一個平台。他說先把一個假設做完。範圍變小，研究味道變重。" },
          ]
        : flags.projectTrack === "product"
          ? [
              { title: "你把 repo 整理到能給人看", body: "README、資料夾、一條能跑的指令。書審時這比口號有用。" },
              { title: "有人真的用了你的工具", body: "只有兩個，而且都是同學。但「能給外人用」這句話開始成立。" },
            ]
          : flags.projectTrack === "data"
            ? [
                { title: "你把使用情境寫成三句話", body: "誰痛、資料從哪來、結果改了什麼。評審終於聽完。" },
                { title: "圖表第一次不像裝飾", body: "你刪掉兩張漂亮但沒有主張的圖。專題變短，比較像論證。" },
              ]
            : [
                { title: "專題展有人停下來看", body: "不是很多，但夠你把作品講完。你第一次覺得這題目不只是學分。" },
                { title: "指導把題目改窄了", body: "你原本想做一個平台。他說先把一個流程做完。範圍變小，完成度變高。" },
              ];
    const good = rng.pick(byTrack);
    return {
      event: {
        kicker: "專題",
        title: good.title,
        body: good.body,
        tone: "good",
        deltas: { project, research, coding, stress: roundDelta(scale(12, rng)), stamina: -cost },
      },
      extraFlags: extra,
    };
  }

  if (id === "submit") {
    const attempts = flags.paperAttempts + 1;
    const p = submitChance(data);
    const researchGain = roundDelta(scale(4.5, rng) * f);
    const extra = { paperAttempts: attempts, heavyThisTerm: flags.heavyThisTerm + 1 };
    if (rng.chance(0.12)) {
      return {
        event: {
          kicker: "投稿",
          title: "Desk reject：格式不符",
          body: "你重新讀了一遍 author kit。頁邊、引用、匿名化。研究還在，只是這週沒換成論文。",
          tone: "bad",
          deltas: { research: Math.max(1, Math.round(researchGain * 0.5)), stress: roundDelta(scale(16, rng)), stamina: -cost },
        },
        extraFlags: extra,
      };
    }
    if (rng.chance(p)) {
      const researchBoost = flags.projectTrack === "research" || flags.advisorTrack === "academic" ? 2 : 0;
      return {
        event: {
          kicker: "投稿",
          title: "接收信出現在收件匣",
          body: "你盯著 Accept 看了很久才敢截圖。委員不會只看一篇，但這是你可以放進書審的證據。",
          tone: "good",
          deltas: {
            papers: 1,
            research: researchGain + 2 + researchBoost,
            network: rng.int(1, 4),
            stress: roundDelta(scale(10, rng)),
            stamina: -cost,
          },
        },
        extraFlags: extra,
      };
    }
    if (rng.chance(0.4)) {
      return {
        event: {
          kicker: "投稿",
          title: "Major revision",
          body: "教授說這是常態。你的壓力值不覺得常態。至少 reviewer 有在讀。",
          tone: "mixed",
          deltas: { research: researchGain + 1, project: rng.int(0, 2), stress: roundDelta(scale(18, rng)), stamina: -cost },
        },
        extraFlags: extra,
      };
    }
    return {
      event: {
        kicker: "投稿",
        title: "投稿被 Reject",
        body: "Reviewer 2 只寫了 The contribution is incremental. 教授回：改完換間會議再投。",
        tone: "bad",
        deltas: { research: Math.max(2, researchGain), stress: roundDelta(scale(20, rng)), stamina: -cost },
      },
      extraFlags: extra,
    };
  }

  if (id === "english") {
    const dim = clamp(1 - stats.english / 140, 0.35, 1);
    const gain = roundDelta(scale(9, rng) * dim * f);
    if (rng.chance(0.2)) {
      return {
        event: {
          kicker: "英文",
          title: "聽力放到一半放空",
          body: "音檔裡的人在討論 internships。你回神時題號已經跳了。還是有背到一點單字。",
          tone: "mixed",
          deltas: { english: Math.max(2, Math.round(gain * 0.45)), stress: roundDelta(scale(9, rng)), stamina: -cost },
        },
      };
    }
    const good = rng.pick([
      { title: "單字卡堅持完一疊", body: "很無聊。研究所書審也看這種無聊。" },
      { title: "跟外籍生聊完一場", body: "你只用簡單句，但有把專題講清楚。這比模擬考更接近面試。" },
      { title: "模擬考分數終於像樣", body: "還不到可以截圖的程度，但曲線在往上。英文是慢變數。" },
    ]);
    return {
      event: {
        kicker: "英文",
        title: good.title,
        body: good.body,
        tone: "good",
        deltas: { english: Math.max(4, gain), stress: roundDelta(scale(8, rng)), stamina: -cost },
      },
    };
  }

  if (id === "cert") {
    const pass = rng.chance(certChance(data));
    const codingish = stats.coding >= stats.english;
    if (pass) {
      return {
        event: {
          kicker: "證照",
          title: codingish ? "技術證照過了" : "英語證照過了",
          body: codingish
            ? "證書 PDF 下載失敗一次，成功一次。你把它放進書審資料夾，檔名寫得很正經。"
            : "分數剛好過門檻。你拍了成績頁，再把通知信備份到另一個信箱。",
          tone: "good",
          deltas: {
            certs: 1,
            coding: codingish ? roundDelta(scale(5, rng) * f) : rng.int(0, 2),
            english: codingish ? rng.int(0, 2) : roundDelta(scale(5, rng) * f),
            stress: roundDelta(scale(12, rng)),
            stamina: -cost,
          },
        },
      };
    }
    return {
      event: {
        kicker: "證照",
        title: "差一分",
        body: "考場冷氣很強。你在答案卡上猶豫的那題，事後證明不該猶豫。技能還是長了一點。",
        tone: "bad",
        deltas: {
          coding: codingish ? roundDelta(scale(3, rng) * f) : 0,
          english: codingish ? 0 : roundDelta(scale(3, rng) * f),
          stress: roundDelta(scale(16, rng)),
          stamina: -cost,
        },
      },
    };
  }

  if (id === "hackathon") {
    const win = rng.chance(0.22);
    const ghost = rng.chance(0.18);
    const coding = roundDelta(scale(11, rng) * f);
    const network = roundDelta(scale(8, rng) * f);
    const project = roundDelta(scale(5, rng) * f);
    const gpaHit = -round2(0.02 + rng.range(0, 0.03));
    const extra = { hackathonCount: flags.hackathonCount + 1, heavyThisTerm: flags.heavyThisTerm + 1 };
    if (ghost) {
      return {
        event: {
          kicker: "黑客松",
          title: "隊友去睡覺了",
          body: "Figma 跟後端同時報錯。你學會在三十小時內把範圍砍到只剩核心，也學會以後先問誰會留到最後。",
          tone: "mixed",
          deltas: {
            coding: Math.max(5, coding),
            project: Math.max(2, Math.round(project * 0.7)),
            network: Math.max(2, Math.round(network * 0.4)),
            gpa: gpaHit,
            stress: roundDelta(scale(14, rng)),
            stamina: -cost,
          },
        },
        extraFlags: extra,
      };
    }
    if (win) {
      return {
        event: {
          kicker: "黑客松",
          title: "佳作。獎金不夠吃一學期",
          body: "但簡報上的 logo 可以放書審。評審問過一句很難的話，你答得不算漂亮，作品有跑起來。",
          tone: "good",
          deltas: {
            coding,
            project: project + 2,
            network: network + 3,
            gpa: gpaHit,
            stress: roundDelta(scale(6, rng)) - 4,
            stamina: -cost,
          },
        },
        extraFlags: extra,
      };
    }
    return {
      event: {
        kicker: "黑客松",
        title: "第二天開始懷疑人生",
        body: "晚上卻跑出一版能 demo 的東西。你沒得獎，但把作品錄成兩分鐘影片。這比較能用。",
        tone: "mixed",
        deltas: { coding, project, network, gpa: gpaHit, stress: roundDelta(scale(10, rng)), stamina: -cost },
      },
      extraFlags: extra,
    };
  }

  if (id === "advisor") {
    const network = roundDelta(scale(8, rng) * (1 + stats.network / 200) * f);
    const research = roundDelta(scale(5, rng) * f);
    if (!flags.hasAdvisor) {
      const p = advisorChance(data);
      if (rng.chance(p)) {
        const track = pickAdvisorTrack(stats, rng);
        const line =
          track === "academic"
            ? "他丟了三篇論文給你，說下週來討論你看懂多少。這是學術向的實驗室。"
            : track === "builder"
              ? "他打開終端機，說先把系統跑起來再談貢獻。這是工程向的實驗室。"
              : "他問你能不能把問題講給外面的人聽。這是偏應用與溝通的實驗室。";
        return {
          event: {
            kicker: "教授",
            title: "教授願意帶你做研究",
            body: `辦公室裡的盆栽看起來也鬆了一口氣。${line}之後的專題、實習與面試都會帶這條路的味道。`,
            tone: "good",
            deltas: { network: network + 4, research: research + 3, stress: roundDelta(scale(6, rng)), stamina: -cost },
          },
          extraFlags: { hasAdvisor: true, advisorTrack: track },
        };
      }
      const miss = rng.pick([
        { title: "今年已經收滿了", body: "門關上的聲音比想像中輕。學長在走廊說：他其實人很好，你要先讀這三篇再去。" },
        { title: "教授把你認成另一個學生", body: "Office hour 排到你時，他叫錯名字。你把專題重新講了一遍，氣氛緩過來，但還沒收下。" },
        { title: "教授出國一個月", body: "門上便條寫著會議。你把自介信又改了一版，人脈還是長了一點。" },
      ]);
      return {
        event: {
          kicker: "教授",
          title: miss.title,
          body: miss.body,
          tone: "mixed",
          deltas: {
            network: Math.max(3, Math.round(network * 0.7)),
            research: Math.max(1, Math.round(research * 0.6)),
            stress: roundDelta(scale(8, rng)),
            stamina: -cost,
          },
        },
      };
    }
    const track = flags.advisorTrack;
    const follow =
      track === "academic"
        ? {
            title: "他要你先把失敗寫進去",
            body: "progress meeting 準時開始。離開時他說：這個方向可以寫。研究紀錄這張牌開始成形。",
            deltas: { network: Math.max(2, Math.round(network * 0.6)), research: research + 2, project: rng.int(0, 2) },
          }
        : track === "builder"
          ? {
              title: "他不看簡報，先看測試",
              body: "你把這週做的事講完。離開時他說：先把測試補上。作品完成度比口號先被看見。",
              deltas: { network: Math.max(2, Math.round(network * 0.6)), research, project: rng.int(2, 5), coding: rng.int(1, 4) },
            }
          : {
              title: "他要你講給外面的人聽",
              body: "你把這週做的事講完。離開時他說：下週試著講給業界的人聽。敘事開始變成訓練。",
              deltas: { network: Math.max(3, Math.round(network * 0.8)), research, english: rng.int(0, 3) },
            };
    return {
      event: {
        kicker: "實驗室",
        title: follow.title,
        body: follow.body,
        tone: "good",
        deltas: { ...follow.deltas, stress: roundDelta(scale(7, rng)), stamina: -cost },
      },
    };
  }

  if (id === "intern") {
    const coding = roundDelta(scale(9, rng) * f);
    const network = roundDelta(scale(10, rng) * f);
    const project = roundDelta(scale(6, rng) * f);
    const gpaHit = -round2((flags.internDone ? 0.02 : 0.04) + rng.range(0, 0.03));
    const first = !flags.internDone;
    const track = first ? pickInternTrack(data, rng) : flags.internTrack;
    const extra: Partial<Flags> = {
      internDone: true,
      internCount: flags.internCount + 1,
      heavyThisTerm: flags.heavyThisTerm + 1,
      internTrack: track,
    };
    const flavor =
      track === "lab"
        ? {
            title: first ? "研究實習：你的工作是把實驗重跑一次" : "實驗室實習續上",
            body: first
              ? "沒有產品上線。你學會把失敗的參數留下來。這段比較能寫進研究紀錄。"
              : "你把上次失敗的那組條件重跑完。指導把你的名字留在紀錄裡。",
            tone: "good" as Tone,
            deltas: { research: rng.int(4, 8), coding: Math.round(coding * 0.5), network, project, gpa: gpaHit },
          }
        : track === "pm"
          ? {
              title: first ? "產品實習：你被問三次誰會用" : "產品實習續上",
              body: first
                ? "第三次你才答得完。這不是純工程，但管理所會要你把這段講清楚。"
                : "你把使用情境寫成一頁。主管說可以拿去書審，你把檔名改得很正經。",
              tone: "good" as Tone,
              deltas: { english: rng.int(2, 5), network: network + 2, project, coding: Math.round(coding * 0.4), gpa: gpaHit },
            }
          : {
              title: first ? "軟體實習：線上壞掉的那天" : "工程實習續上",
              body: first
                ? "隔天會議上沒人提起你的名字。你還是把重現步驟寫進文件。這段比較能當作品證據。"
                : "你把內部工具的流程修到能給下一個人用。實習證明上不會寫 lint，書審可以寫流程改善。",
              tone: "mixed" as Tone,
              deltas: { coding, network, project: project + 2, english: rng.int(0, 3), gpa: gpaHit },
            };
    return {
      event: {
        kicker: "實習",
        title: flavor.title,
        body: flavor.body,
        tone: flavor.tone,
        deltas: { ...flavor.deltas, stress: roundDelta(scale(14, rng)), stamina: -cost },
      },
      extraFlags: extra,
    };
  }

  const overRest = stats.stamina > 82 && stats.stress < 28;
  const stamina = roundDelta(scale(42, rng, 0.12));
  const stress = -roundDelta(scale(22, rng, 0.12));
  if (overRest) {
    return {
      event: {
        kicker: "休息",
        title: "躺得很徹底",
        body: "群組已有一百則未讀。你本來要休息，結果把想做的事列成清單，壓力沒降多少，進度也沒動。",
        tone: "calm",
        deltas: { stamina: Math.round(stamina * 0.4), stress: Math.round(stress * 0.4), gpa: rng.chance(0.35) ? -0.02 : 0 },
      },
      extraFlags: { restCount: flags.restCount + 1 },
    };
  }
  const calm = rng.pick([
    { title: "夜市吃到飽", body: "體力回來了，錢包沒有。隔天你比較能看文獻。" },
    { title: "回家一趟", body: "冰箱比實驗室友善。爸媽問成績，你說還可以，這句話暫時成立。" },
    { title: "颱風假", body: "外面風雨很大。你把進度條只往前拖了一點，主要是補眠。" },
    { title: "實驗室聚餐你請假", body: "這次選擇睡覺。人脈沒長，隔天 meeting 你比較像活人。" },
  ]);
  return {
    event: {
      kicker: "休息",
      title: calm.title,
      body: calm.body,
      tone: "calm",
      deltas: { stamina, stress },
    },
    extraFlags: { restCount: flags.restCount + 1 },
  };
}

function maybeCampusEvent(data: GameData, rng: Rng): GameEvent | null {
  if (!rng.chance(0.18)) return null;
  const r = data.roommate;
  const extra: GameEvent[] = [
    { kicker: "校園", title: "系學會來拉幹部", body: "你說再考慮。還是被加進一個工作群。人脈微幅上升，時間沒有。", tone: "mixed", deltas: { network: rng.int(2, 5), stamina: -rng.int(4, 8), stress: rng.int(2, 6) } },
    { kicker: "家庭", title: "爸媽來電問成績", body: "你把 GPA 說成四捨五入後比較好看的版本。掛電話後壓力沒有四捨五入。", tone: "mixed", deltas: { stress: rng.int(4, 9) } },
    { kicker: "走廊", title: "又被問研究所想念哪", body: "你還沒想好。對方已經開始比較學校。這對話沒有標準答案。", tone: "calm", deltas: { stress: rng.int(3, 8), network: rng.int(0, 2) } },
    { kicker: "實驗室", title: "冰箱裡的布丁消失", body: "便條紙寫著「我以為是公的」。研究沒有進展，實驗室文化有。", tone: "calm", deltas: { network: rng.int(1, 3), stress: -rng.int(1, 4) } },
    { kicker: "通識", title: "這週點名", body: "你坐在最後一排把論文 PDF 開著。學分保住了，專注沒有。", tone: "calm", deltas: { stamina: -rng.int(3, 6), gpa: rng.chance(0.4) ? 0.01 : 0 } },
    { kicker: "圖書館", title: "搶到插座", body: "小事。但這週的小事決定你能不能把作業做完。", tone: "good", deltas: { stamina: rng.int(2, 5), stress: -rng.int(1, 3) } },
  ];
  if (r) {
    extra.push(
      {
        kicker: "室友",
        title: `${r.name} 把螢幕開到最大`,
        body: "他說在趕進度。你戴上眼罩，假裝這是宿舍該有的聲音。",
        tone: "calm",
        deltas: { stress: rng.int(2, 6), network: 1 },
      },
      {
        kicker: "室友",
        title: `${r.name} 問你研究所`,
        body: "你還沒想好。他把自己的計畫講完，空氣有點安靜。",
        tone: "mixed",
        deltas: { stress: rng.int(2, 5), network: rng.int(1, 3) },
      },
    );
  }
  return rng.pick(extra);
}

function mergeFlags(flags: Flags, extra?: Partial<Flags>): Flags {
  if (!extra) return flags;
  return {
    ...flags,
    ...extra,
    actionCountsThisTerm: extra.actionCountsThisTerm ?? flags.actionCountsThisTerm,
    actionCounts: extra.actionCounts ?? flags.actionCounts,
  };
}

function pushJournal(data: GameData, event: GameEvent): JournalEntry[] {
  const entry: JournalEntry = {
    id: `${data.turn}-${event.title}`,
    phase: data.phase,
    title: event.title,
    body: event.body,
    tone: event.tone,
    deltas: event.deltas,
  };
  return [entry, ...data.journal].slice(0, 60);
}

export function performAction(
  data: GameData,
  id: ActionId,
): { data: GameData; unlocked: AchievementUnlock[] } {
  if (actionLockReason(data, id)) return { data, unlocked: [] };
  const rng = createRng(data.rngState);
  const built = resolveAction(data, id, rng);
  const campus = id === "rest" ? null : maybeCampusEvent(data, rng);
  let deltas = { ...built.event.deltas };
  if (campus) {
    (Object.keys(campus.deltas) as (keyof Deltas)[]).forEach((k) => {
      deltas[k] = (deltas[k] ?? 0) + (campus.deltas[k] ?? 0);
    });
  }
  const before = data.stats;
  const stats = applyDeltas(before, deltas);
  const actual = diffStats(before, stats);
  const event: GameEvent = {
    ...built.event,
    body: campus ? `${built.event.body}\n\n另外：${campus.title}。${campus.body}` : built.event.body,
    deltas: actual,
    tone: campus && campus.tone === "bad" ? "mixed" : built.event.tone,
  };
  const counts = { ...data.flags.actionCountsThisTerm };
  counts[id] = (counts[id] ?? 0) + 1;
  const life = { ...data.flags.actionCounts };
  life[id] = (life[id] ?? 0) + 1;
  const flags = mergeFlags(data.flags, {
    ...built.extraFlags,
    actionCountsThisTerm: counts,
    actionCounts: life,
  });
  const next: GameData = {
    ...data,
    stats,
    flags,
    actionsLeft: data.actionsLeft - 1,
    pendingEvent: event,
    journal: pushJournal(data, event),
    rngState: rng.getState(),
    turn: data.turn + 1,
  };
  const unlocked = takeNewAchievements(next);
  next.achievements = [...data.achievements, ...unlocked.map((a) => a.id)];
  return { data: next, unlocked };
}

export function dismissEvent(data: GameData): GameData {
  if (!data.pendingEvent) return data;
  if (data.actionsLeft > 0) return { ...data, pendingEvent: null };
  return { ...buildRecap(data), pendingEvent: null, screen: "recap" };
}

function buildRecap(data: GameData): GameData {
  const rng = createRng(data.rngState);
  const flags = data.flags;
  const notes: string[] = [];
  const d: Deltas = {};

  const skippedStudy = flags.gpaActionsThisTerm === 0;
  const heavy = flags.heavyThisTerm;
  if (skippedStudy && heavy >= 2) {
    d.gpa = -round2(0.06 + rng.range(0, 0.06));
    notes.push("這學期幾乎沒顧課，期末把 GPA 往下拉。");
  } else if (skippedStudy) {
    d.gpa = -round2(0.03 + rng.range(0, 0.03));
    notes.push("沒有特別衝成績，GPA 微幅下滑。");
  } else if (flags.gpaActionsThisTerm >= 2) {
    d.gpa = round2(0.02 * gpaHeadroom(data.stats.gpa));
    notes.push("課業有被照顧到，期末沒有意外。");
  } else {
    notes.push("成績與其他行動之間，這學期打平。");
  }

  if (data.stats.stress >= 85) {
    d.stress = (d.stress ?? 0) - 8;
    notes.push("假期先把人修回來。壓力仍偏高。");
  } else {
    d.stress = (d.stress ?? 0) - 6;
    notes.push("學期結束，體力部分回來。");
  }

  if (flags.hasAdvisor) {
    const track = flags.advisorTrack !== "none" ? ADVISOR_TRACK[flags.advisorTrack].badge : "實驗室";
    notes.push(
      data.phase >= LAST_PLAY_PHASE ? `${track}可以寫進推薦。` : `${track}還在，下學期可以續上。`,
    );
  }
  if (flags.projectTrack !== "none") notes.push(`${PROJECT_TRACK[flags.projectTrack].badge}還在長。`);
  if (flags.internDone && flags.internCount > 0) {
    const intern = flags.internTrack !== "none" ? INTERN_TRACK[flags.internTrack].badge : "實習";
    notes.push(`${intern}經歷已可寫進履歷。`);
  }

  const roommate = data.roommate ? simRoommateTerm(data.roommate, data.phase, rng) : null;
  const roommateNote = roommate
    ? `${roommate.name} 這學期：${roommate.lastActions.map((a) => ACTION_MAP[a].name).join("、")}`
    : "";

  const before = data.stats;
  const stats = applyDeltas(before, { ...d, stamina: 0 });
  const recovered = clampStats({
    ...stats,
    stamina: clamp(100 - Math.round(stats.stress * 0.22), 46, 100),
  });
  const recapDeltas = diffStats(before, recovered);
  const phase = PHASES[data.phase]!;
  const nextPhase = data.phase + 1;
  const nextLabel =
    nextPhase > LAST_PLAY_PHASE ? "組裝書審" : (PHASES[nextPhase]?.label ?? "下一學期");

  const recap: SemesterRecap = {
    phase: data.phase,
    title: `${phase.label} 結束`,
    body: phase.blurb,
    notes,
    deltas: recapDeltas,
    nextLabel,
    roommateNote,
    roommateActions: roommate?.lastActions ?? [],
  };

  const next: GameData = {
    ...data,
    stats: recovered,
    roommate,
    recap,
    rngState: rng.getState(),
    journal: [
      {
        id: `recap-${data.phase}`,
        phase: data.phase,
        title: recap.title,
        body: notes.join(" "),
        tone: ((recapDeltas.gpa ?? 0) < 0 ? "mixed" : "calm") as Tone,
        deltas: recapDeltas,
      },
      ...data.journal,
    ].slice(0, 60),
  };
  const unlocked = takeNewAchievements(next);
  next.achievements = [...data.achievements, ...unlocked.map((a) => a.id)];
  return next;
}

export function advanceSemester(data: GameData): GameData {
  if (data.phase >= LAST_PLAY_PHASE) {
    return {
      ...data,
      screen: "dossier",
      recap: null,
      pendingEvent: null,
      dossier: data.dossier.length ? data.dossier : ["transcript"],
    };
  }
  return {
    ...data,
    screen: "play",
    phase: data.phase + 1,
    actionsLeft: ACTIONS_PER_SEMESTER,
    recap: null,
    pendingEvent: null,
    flags: {
      ...data.flags,
      gpaActionsThisTerm: 0,
      heavyThisTerm: 0,
      burnedThisTerm: false,
      actionCountsThisTerm: {},
    },
  };
}

export function evidenceUnlocked(data: GameData, id: EvidenceId): boolean {
  if (id === "transcript") return true;
  if (id === "paper") return data.stats.papers >= 1;
  if (id === "letter") return data.flags.hasAdvisor;
  if (id === "project") return data.stats.project >= 40;
  if (id === "intern") return data.flags.internDone;
  if (id === "english") return data.stats.english >= 55;
  if (id === "cert") return data.stats.certs >= 1;
  if (id === "hackathon") return data.flags.hackathonCount >= 1;
  if (id === "labwork") {
    return (
      data.flags.projectTrack === "research" ||
      data.flags.internTrack === "lab" ||
      (data.flags.advisorTrack === "academic" && data.stats.research >= 36)
    );
  }
  return false;
}

export function toggleEvidence(data: GameData, id: EvidenceId): GameData {
  if (!evidenceUnlocked(data, id)) return data;
  const has = data.dossier.includes(id);
  if (has) return { ...data, dossier: data.dossier.filter((x) => x !== id) };
  if (data.dossier.length >= 3) return data;
  return { ...data, dossier: [...data.dossier, id] };
}

export function replaceEvidence(data: GameData, outId: EvidenceId, inId: EvidenceId): GameData {
  if (!evidenceUnlocked(data, inId)) return data;
  if (!data.dossier.includes(outId) || data.dossier.includes(inId)) return data;
  return { ...data, dossier: data.dossier.map((x) => (x === outId ? inId : x)) };
}

export function dossierItemBonus(school: (typeof SCHOOLS)[number], id: EvidenceId): number {
  const w = school.weights;
  if (id === "transcript") return w.gpa * 18;
  if (id === "paper") return w.papers * 24;
  if (id === "letter") return w.advisor * 36;
  if (id === "project") return w.project * 26;
  if (id === "intern") return w.intern * 36;
  if (id === "english") return w.english * 28;
  if (id === "cert") return w.certs * 32;
  if (id === "hackathon") return ((w.coding + w.project) / 2) * 22;
  if (id === "labwork") return w.research * 26 + w.papers * 10;
  return 0;
}

function dossierBonus(school: (typeof SCHOOLS)[number], picks: EvidenceId[]): number {
  const n = picks.reduce((sum, id) => sum + dossierItemBonus(school, id), 0);
  return clamp(n, 0, 12);
}

function trackBonus(data: GameData, schoolTrack: string): number {
  let n = 0;
  const a = data.flags.advisorTrack;
  const p = data.flags.projectTrack;
  const i = data.flags.internTrack;
  if (a === "academic" && schoolTrack === "學術") n += 5;
  else if (a === "builder" && (schoolTrack === "實務" || schoolTrack === "均衡")) n += 4;
  else if (a === "manager" && schoolTrack === "管理") n += 5;
  else if (a !== "none" && schoolTrack === "均衡") n += 2;
  if (p === "research" && schoolTrack === "學術") n += 3;
  if (p === "product" && (schoolTrack === "實務" || schoolTrack === "均衡")) n += 3;
  if (p === "data" && (schoolTrack === "均衡" || schoolTrack === "管理")) n += 3;
  if (i === "lab" && schoolTrack === "學術") n += 3;
  if (i === "swe" && schoolTrack === "實務") n += 3;
  if (i === "pm" && schoolTrack === "管理") n += 3;
  return n;
}

function normGpa(gpa: number) {
  return clamp((gpa - 2.35) / 1.95, 0, 1);
}

function verdictOf(score: number): Verdict {
  if (score >= 74) return "likely";
  if (score >= 60) return "possible";
  if (score >= 48) return "risk";
  return "low";
}

export function evaluateAdmission(data: GameData): SchoolResult[] {
  const s = data.stats;
  const f = data.flags;
  const picks = data.dossier;
  const interview = data.interview;
  return SCHOOLS.map((school) => {
    const w = school.weights;
    let raw =
      normGpa(s.gpa) * w.gpa +
      (s.english / 100) * w.english +
      (s.coding / 100) * w.coding +
      (s.research / 100) * w.research +
      (s.project / 100) * w.project +
      Math.min(s.papers / 2, 1) * w.papers +
      Math.min(s.certs / 3, 1) * w.certs +
      (s.network / 100) * w.network +
      (f.internDone ? w.intern : 0) +
      (f.hasAdvisor ? w.advisor : 0);

    if (s.gpa < school.gpaFloor) {
      const gap = school.gpaFloor - s.gpa;
      raw *= clamp(1 - gap * 0.48, 0.4, 1);
    }
    raw *= 1 - (s.stress / 100) * 0.05;
    const bonus =
      dossierBonus(school, picks) +
      trackBonus(data, school.track) +
      (interview && interview.schoolId === school.id ? interview.totalDelta : 0);
    const score = clamp(Math.round(raw * 108 + 6 + bonus), 8, 97);
    const bits: string[] = [];
    if (s.gpa >= school.gpaFloor + 0.08) bits.push("成績單通過內部慣用門檻");
    else if (s.gpa < school.gpaFloor) bits.push("GPA 低於這個所常見的舒適線");
    if (w.papers >= 0.12 && s.papers === 0) bits.push("缺少可放書審的論文");
    if (w.papers >= 0.12 && s.papers >= 1) bits.push("論文紀錄有加分");
    if (w.intern >= 0.08 && f.internDone) bits.push("實務經歷對這個所有感");
    if (w.intern >= 0.08 && !f.internDone) bits.push("實務證據偏薄");
    if (w.english >= 0.12 && s.english < 45) bits.push("英文證明偏弱");
    if (w.english >= 0.12 && s.english >= 70) bits.push("英文是加分項");
    if (f.hasAdvisor && w.advisor >= 0.05) bits.push("有指導教授路徑，推薦信比較不像憑空出現");
    if (w.project >= 0.12 && s.project < 35) bits.push("作品完成度還不夠硬");
    if (w.project >= 0.12 && s.project >= 60) bits.push("專題完成度好看");
    if (picks.includes("paper") && w.papers >= 0.1) bits.push("書審把論文放在前面");
    if (picks.includes("intern") && w.intern >= 0.08) bits.push("書審強調實務");
    if (picks.includes("labwork") && w.research >= 0.1) bits.push("書審放了研究過程");
    if (f.projectTrack !== "none") bits.push(`${PROJECT_TRACK[f.projectTrack].badge}對上${school.track}取向`);
    const comment = bits.slice(0, 2).join("；") || school.blurb;
    return {
      id: school.id,
      name: school.name,
      short: school.short,
      track: school.track,
      score,
      verdict: verdictOf(score),
      comment,
      estimate: true as const,
      interviewed: interview?.schoolId === school.id,
    };
  }).sort((a, b) => b.score - a.score);
}

export function optionSupported(data: GameData, need?: InterviewNeed): boolean {
  if (!need) return true;
  const s = data.stats;
  const f = data.flags;
  if (need.papers && s.papers < need.papers) return false;
  if (need.intern && !f.internDone) return false;
  if (need.internTrack && f.internTrack !== need.internTrack) return false;
  if (need.project && s.project < need.project) return false;
  if (need.projectTrack && f.projectTrack !== need.projectTrack) return false;
  if (need.advisor && !f.hasAdvisor) return false;
  if (need.advisorTrack && f.advisorTrack !== need.advisorTrack) return false;
  if (need.english && s.english < need.english) return false;
  if (need.hackathon && f.hackathonCount < need.hackathon) return false;
  if (need.certs && s.certs < need.certs) return false;
  if (need.gpa && s.gpa < need.gpa) return false;
  return true;
}

export function resolveInterviewOption(data: GameData, opt: InterviewOption) {
  const supported = optionSupported(data, opt.need);
  return {
    supported,
    delta: supported ? opt.delta : opt.weakDelta,
    reply: supported ? opt.reply : opt.weakReply,
  };
}

function shuffleOptions(q: InterviewQuestion, rng: Rng): InterviewQuestion {
  return {
    prompt: q.prompt,
    options: [...q.options].sort(() => rng.next() - 0.5),
  };
}

function buildInterview(data: GameData, school: SchoolResult, rng: Rng): InterviewState {
  const bank = INTERVIEW_BANK[school.track] ?? INTERVIEW_BANK["均衡"]!;
  const fallback = INTERVIEW_BANK["均衡"]![1]!;
  const third = data.flags.hasAdvisor
    ? ROUTE_QUESTIONS[0]!
    : data.flags.internDone
      ? ROUTE_QUESTIONS[1]!
      : fallback;
  const questions = [bank[0]!, bank[1]!, third].map((q) => shuffleOptions(q, rng));
  return {
    schoolId: school.id,
    schoolShort: school.short,
    index: 0,
    totalDelta: 0,
    questions,
    log: [],
  };
}

function finishRun(data: GameData): GameData {
  const admission = data.admission ?? evaluateAdmission(data);
  const mid: GameData = { ...data, screen: "result", admission, phase: RESULT_PHASE };
  const attribution = buildAttribution(mid);
  const withAttr: GameData = { ...mid, attribution };
  const unlocked = takeNewAchievements(withAttr);
  withAttr.achievements = [...data.achievements, ...unlocked.map((a) => a.id)];
  withAttr.history = pushHistory(withAttr);
  return withAttr;
}

export function submitDossier(data: GameData): GameData {
  if (data.dossier.length === 0) return data;
  const withPhase: GameData = { ...data, phase: RESULT_PHASE, recap: null };
  const admission = evaluateAdmission(withPhase);
  const best = admission[0];
  const rng = createRng(data.rngState);
  const next: GameData = { ...withPhase, admission };
  if (best && best.score >= 48) {
    next.screen = "interview";
    next.interview = buildInterview(withPhase, best, rng);
    next.rngState = rng.getState();
    return next;
  }
  return finishRun(next);
}

export function answerInterview(data: GameData, optionIndex: number): GameData {
  const iv = data.interview;
  if (!iv) return data;
  const q = iv.questions[iv.index];
  if (!q) return data;
  const opt = q.options[optionIndex];
  if (!opt) return data;
  const resolved = resolveInterviewOption(data, opt);
  const nextIv: InterviewState = {
    ...iv,
    index: iv.index + 1,
    totalDelta: clamp(iv.totalDelta + resolved.delta, -14, 16),
    log: [
      ...iv.log,
      { prompt: q.prompt, pick: opt.label, delta: resolved.delta, supported: resolved.supported },
    ],
  };
  const mid: GameData = { ...data, interview: nextIv };
  if (nextIv.index < nextIv.questions.length) return mid;
  const admission = evaluateAdmission(mid);
  return finishRun({ ...mid, admission });
}

export function roommateScore(data: GameData): number | null {
  if (!data.roommate) return null;
  const fake: GameData = {
    ...data,
    stats: { ...data.roommate.stats, papers: data.roommate.papers },
    flags: {
      ...emptyFlags(),
      hasAdvisor: data.roommate.hasAdvisor,
      internDone: data.roommate.internDone,
    },
    dossier: ["transcript"],
    interview: null,
  };
  const list = evaluateAdmission(fake);
  return list[0]?.score ?? null;
}

export function examTrackScore(data: GameData) {
  const s = data.stats;
  return clamp(Math.round(normGpa(s.gpa) * 52 + (s.english / 100) * 22 + (s.coding / 100) * 14 + 12), 12, 96);
}

export function buildAttribution(data: GameData): Attribution {
  const best = (data.admission ?? evaluateAdmission(data))[0];
  const school = SCHOOLS.find((s) => s.id === best?.id) ?? SCHOOLS[0]!;
  const counts = Object.entries(data.flags.actionCounts) as [ActionId, number][];
  counts.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const lines: Attribution["lines"] = [];
  const topActs = counts.filter(([, n]) => n > 0).slice(0, 3);
  if (topActs.length) {
    lines.push({
      label: "四年怎麼過",
      detail: topActs.map(([id, n]) => `${ACTION_MAP[id].name} ${n} 次`).join("、"),
    });
  }
  if (data.flags.advisorTrack !== "none") {
    lines.push({
      label: "教授路線",
      detail: `${ADVISOR_TRACK[data.flags.advisorTrack].badge}。對口的所會加分，不對口的幾乎不加。`,
    });
  }
  if (data.flags.projectTrack !== "none") {
    lines.push({
      label: "專題方向",
      detail: PROJECT_TRACK[data.flags.projectTrack].badge,
    });
  }
  if (data.flags.internTrack !== "none") {
    lines.push({
      label: "實習方向",
      detail: INTERN_TRACK[data.flags.internTrack].badge,
    });
  }
  if (data.dossier.length) {
    const ranked = data.dossier
      .map((id) => ({
        name: EVIDENCE.find((e) => e.id === id)?.name ?? id,
        bonus: round2(dossierItemBonus(school, id)),
      }))
      .sort((a, b) => b.bonus - a.bonus);
    lines.push({
      label: "書審三張",
      detail: ranked.map((x) => `${x.name}對${school.short}估 +${x.bonus.toFixed(1)}`).join("；"),
    });
  }
  const iv = data.interview;
  if (iv && iv.log.length) {
    const held = iv.log.filter((x) => x.supported).length;
    const weak = iv.log.filter((x) => !x.supported).length;
    lines.push({
      label: "口試",
      detail: `印象 ${iv.totalDelta > 0 ? "+" : ""}${iv.totalDelta}。${held} 題有經歷支撐${weak ? `，${weak} 題被聽成沒有現場` : ""}。`,
    });
  } else {
    lines.push({
      label: "口試",
      detail: "書審沒過線，沒進面試。",
    });
  }
  const mate = roommateScore(data);
  const my = best?.score ?? 0;
  const roommateNote =
    mate === null
      ? "這輪沒有室友對照。"
      : `室友只比四年能力與實驗室／實習，固定只放成績單，也不進面試。你的 ${my} 含書審三張與口試加減分；室友 ${mate} 不含這兩段。`;

  const nextTry = nextStrategy(data, school.track, best?.verdict ?? "low");
  return { lines, roommateNote, nextTry };
}

function nextStrategy(data: GameData, track: string, verdict: Verdict): string {
  const f = data.flags;
  const s = data.stats;
  if (track === "學術" && s.papers === 0) {
    return "下一輪可以試：少衝一次 GPA，把行動換成投稿，看學術所會不會翻盤。";
  }
  if ((track === "實務" || verdict === "risk" || verdict === "low") && !f.internDone) {
    return "下一輪可以試：大二下把實習排進去，看實務所會不會翻盤。";
  }
  if (track === "管理" && s.english < 55) {
    return "下一輪可以試：把英文養到能放證明，再進管理所的口試。";
  }
  if (f.projectTrack === "none") {
    return "下一輪可以試：專題連做兩次讓方向定型，書審會多一張對口的牌。";
  }
  const weak = data.interview?.log.some((x) => !x.supported);
  if (weak) {
    return "下一輪先把那條經歷做完，再講同一句。口試吃現場，不吃氣勢。";
  }
  if (verdict === "likely") {
    return "這一輪主軸成立。下一輪可以故意走相反路線，驗證是不是只有這條路吃得開。";
  }
  return "下一輪可以試：把行動集中在目標所最重的兩項，少做第三項。";
}

function makeRunRecord(data: GameData): RunRecord {
  const best = data.admission?.[0];
  return {
    id: `${data.seed}-r`,
    at: Date.now(),
    name: data.profile?.name ?? "",
    major: data.profile?.major ?? "cs",
    archetype: data.profile?.archetype ?? "balanced",
    advisorTrack: data.flags.advisorTrack,
    internTrack: data.flags.internTrack,
    projectTrack: data.flags.projectTrack,
    bestShort: best?.short ?? "—",
    bestScore: best?.score ?? 0,
    verdict: best?.verdict ?? "low",
    mateScore: roommateScore(data),
    examScore: examTrackScore(data),
    dossier: [...data.dossier],
    interviewDelta: data.interview?.totalDelta ?? 0,
    interviewed: Boolean(data.interview && data.interview.log.length > 0),
  };
}

function pushHistory(data: GameData): RunRecord[] {
  const rec = makeRunRecord(data);
  const prev = data.history ?? [];
  if (prev[0]?.id === rec.id) return prev;
  return [rec, ...prev].slice(0, MAX_HISTORY);
}

export function takeNewAchievements(data: GameData): AchievementUnlock[] {
  const have = new Set(data.achievements);
  const s = data.stats;
  const f = data.flags;
  const roommateBest = data.screen === "result" ? roommateScore(data) : null;
  const myBest = data.admission?.[0]?.score ?? 0;
  const checks: Record<string, boolean> = {
    "first-term": data.phase >= 1 || data.recap !== null,
    advisor: f.hasAdvisor,
    paper: s.papers >= 1,
    intern: f.internDone,
    certs3: s.certs >= 3,
    eng80: s.english >= 80,
    gpa39: s.gpa >= 3.9,
    code70: s.coding >= 70,
    burnout: f.burnoutCount >= 1 && data.screen === "result",
    top:
      data.admission?.some(
        (r) => r.verdict === "likely" && ["ntu-cs", "ntu-im", "nthu-cs", "nycu-cs"].includes(r.id),
      ) ?? false,
    rest8: f.restCount >= 8,
    hack3: f.hackathonCount >= 3,
    balanced: s.english >= 50 && s.coding >= 50 && s.research >= 50 && s.project >= 50 && s.network >= 50,
    finish: data.screen === "result" || data.screen === "dossier" || data.screen === "interview",
    dossier: data.dossier.length >= 1 && (data.screen === "result" || data.screen === "interview" || data.screen === "dossier"),
    interview: (data.interview?.totalDelta ?? 0) > 0 && data.screen === "result",
    "roommate-win": roommateBest !== null && myBest > roommateBest && data.screen === "result",
  };
  const unlocked: AchievementUnlock[] = [];
  for (const def of ACHIEVEMENTS) {
    if (have.has(def.id)) continue;
    if (checks[def.id]) unlocked.push({ id: def.id, name: def.name, blurb: def.blurb });
  }
  return unlocked;
}

export function hasContinue(data: GameData) {
  return data.gameActive && data.profile !== null;
}

export function resumeScreen(data: GameData): GameData["screen"] {
  if (data.screen === "create") return "create";
  if (data.admission && data.screen === "result") return "result";
  if (data.interview && data.screen === "interview") return "interview";
  if (data.screen === "dossier") return "dossier";
  if (data.recap) return "recap";
  if (data.profile) return "play";
  return "title";
}

export function formatDelta(stat: keyof Stats, value: number) {
  const sign = value > 0 ? "+" : "";
  if (stat === "gpa") return `${sign}${value.toFixed(2)}`;
  return `${sign}${Math.round(value)}`;
}

export function englishBand(n: number) {
  if (n >= 85) return "接近流利";
  if (n >= 70) return "多益金色帶";
  if (n >= 55) return "中高階";
  if (n >= 40) return "中階";
  if (n >= 25) return "初階";
  return "起步";
}

export function gpaBand(n: number) {
  if (n >= 4.0) return "頂尖";
  if (n >= 3.7) return "推甄舒適";
  if (n >= 3.4) return "中上";
  if (n >= 3.0) return "普通";
  return "需補救";
}

export function normalizeSave(data: GameData | undefined): GameData {
  if (!data || data.version > SAVE_VERSION) return titleData();
  const profile = data.profile;
  let roommate = data.roommate ?? null;
  if (!roommate && profile && data.gameActive) {
    roommate = makeRoommate(profile, data.seed || 1);
    const rng = createRng((data.seed || 1) ^ 0x9e3779b9);
    for (let p = 0; p < data.phase; p++) roommate = simRoommateTerm(roommate, p, rng);
  }
  const history = data.history ?? [];
  return {
    ...titleData(history),
    ...data,
    version: SAVE_VERSION,
    flags: { ...emptyFlags(), ...data.flags },
    roommate,
    dossier: data.dossier ?? [],
    interview: data.interview
      ? { ...data.interview, log: data.interview.log ?? [] }
      : null,
    attribution: data.attribution ?? null,
    history,
    recap: data.recap
      ? {
          ...data.recap,
          roommateNote: data.recap.roommateNote ?? "",
          roommateActions: data.recap.roommateActions ?? [],
        }
      : null,
  };
}

export { EVIDENCE };
