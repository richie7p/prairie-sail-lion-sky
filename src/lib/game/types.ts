export const SAVE_VERSION = 3;

export type Screen =
  | "title"
  | "create"
  | "play"
  | "recap"
  | "dossier"
  | "interview"
  | "result";

export type MajorId = "cs" | "im" | "ee" | "math";
export type ArchetypeId = "scholar" | "hacker" | "social" | "balanced";
export type AdvisorTrack = "none" | "academic" | "builder" | "manager";
export type ProjectTrack = "none" | "research" | "product" | "data";
export type InternTrack = "none" | "swe" | "lab" | "pm";

export type ActionId =
  | "gpa"
  | "project"
  | "submit"
  | "english"
  | "cert"
  | "hackathon"
  | "advisor"
  | "intern"
  | "rest";

export type EvidenceId =
  | "transcript"
  | "paper"
  | "intern"
  | "project"
  | "english"
  | "letter"
  | "cert"
  | "hackathon"
  | "labwork";

export type StatId =
  | "gpa"
  | "english"
  | "coding"
  | "research"
  | "project"
  | "papers"
  | "certs"
  | "network"
  | "stress"
  | "stamina";

export type Tone = "good" | "bad" | "mixed" | "calm";

export type Deltas = Partial<Record<StatId, number>>;

export interface Stats {
  gpa: number;
  english: number;
  coding: number;
  research: number;
  project: number;
  papers: number;
  certs: number;
  network: number;
  stress: number;
  stamina: number;
}

export interface Profile {
  name: string;
  major: MajorId;
  archetype: ArchetypeId;
}

export interface Flags {
  hasAdvisor: boolean;
  internDone: boolean;
  internCount: number;
  burnoutCount: number;
  restCount: number;
  hackathonCount: number;
  paperAttempts: number;
  gpaActionsThisTerm: number;
  heavyThisTerm: number;
  burnedThisTerm: boolean;
  actionCountsThisTerm: Partial<Record<ActionId, number>>;
  actionCounts: Partial<Record<ActionId, number>>;
  advisorTrack: AdvisorTrack;
  projectTrack: ProjectTrack;
  internTrack: InternTrack;
}

export interface GameEvent {
  kicker: string;
  title: string;
  body: string;
  tone: Tone;
  deltas: Deltas;
}

export interface JournalEntry {
  id: string;
  phase: number;
  title: string;
  body: string;
  tone: Tone;
  deltas: Deltas;
}

export interface SemesterRecap {
  phase: number;
  title: string;
  body: string;
  notes: string[];
  deltas: Deltas;
  nextLabel: string;
  roommateNote: string;
  roommateActions: ActionId[];
}

export interface RoommateState {
  name: string;
  archetype: ArchetypeId;
  stats: Stats;
  hasAdvisor: boolean;
  internDone: boolean;
  papers: number;
  lastActions: ActionId[];
}

export interface InterviewNeed {
  papers?: number;
  intern?: boolean;
  internTrack?: Exclude<InternTrack, "none">;
  project?: number;
  projectTrack?: Exclude<ProjectTrack, "none">;
  advisor?: boolean;
  advisorTrack?: Exclude<AdvisorTrack, "none">;
  english?: number;
  hackathon?: number;
  certs?: number;
  gpa?: number;
}

export interface InterviewOption {
  label: string;
  delta: number;
  weakDelta: number;
  reply: string;
  weakReply: string;
  need?: InterviewNeed;
}

export interface InterviewQuestion {
  prompt: string;
  options: InterviewOption[];
}

export interface InterviewLog {
  prompt: string;
  pick: string;
  delta: number;
  supported: boolean;
}

export interface InterviewState {
  schoolId: string;
  schoolShort: string;
  index: number;
  totalDelta: number;
  questions: InterviewQuestion[];
  log: InterviewLog[];
}

export type Verdict = "likely" | "possible" | "risk" | "low";

export interface SchoolResult {
  id: string;
  name: string;
  short: string;
  track: string;
  score: number;
  verdict: Verdict;
  comment: string;
  estimate: true;
  interviewed?: boolean;
}

export interface AchievementUnlock {
  id: string;
  name: string;
  blurb: string;
}

export interface AttributionLine {
  label: string;
  detail: string;
}

export interface Attribution {
  lines: AttributionLine[];
  roommateNote: string;
  nextTry: string;
}

export interface RunRecord {
  id: string;
  at: number;
  name: string;
  major: MajorId;
  archetype: ArchetypeId;
  advisorTrack: AdvisorTrack;
  internTrack: InternTrack;
  projectTrack: ProjectTrack;
  bestShort: string;
  bestScore: number;
  verdict: Verdict;
  mateScore: number | null;
  examScore: number;
  dossier: EvidenceId[];
  interviewDelta: number;
  interviewed: boolean;
}

export interface GameData {
  version: number;
  screen: Screen;
  gameActive: boolean;
  profile: Profile | null;
  phase: number;
  actionsLeft: number;
  stats: Stats;
  flags: Flags;
  journal: JournalEntry[];
  achievements: string[];
  pendingEvent: GameEvent | null;
  recap: SemesterRecap | null;
  admission: SchoolResult[] | null;
  roommate: RoommateState | null;
  dossier: EvidenceId[];
  interview: InterviewState | null;
  attribution: Attribution | null;
  history: RunRecord[];
  seed: number;
  rngState: number;
  turn: number;
}

export const STAT_ORDER: StatId[] = [
  "gpa",
  "english",
  "coding",
  "research",
  "project",
  "papers",
  "certs",
  "network",
  "stress",
  "stamina",
];
