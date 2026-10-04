import { z } from "zod";
import { SAVE_VERSION, type GameData } from "./types";

const text = z.string().max(20000);
const nonnegative = z.number().finite().nonnegative();
const uint = nonnegative.int().max(0xffffffff);
const major = z.enum(["cs", "im", "ee", "math"]);
const archetype = z.enum(["scholar", "hacker", "social", "balanced"]);
const advisorTrack = z.enum(["none", "academic", "builder", "manager"]);
const projectTrack = z.enum(["none", "research", "product", "data"]);
const internTrack = z.enum(["none", "swe", "lab", "pm"]);
const action = z.enum(["gpa", "project", "submit", "english", "cert", "hackathon", "advisor", "intern", "rest"]);
const evidence = z.enum(["transcript", "paper", "intern", "project", "english", "letter", "cert", "hackathon", "labwork"]);
const verdict = z.enum(["likely", "possible", "risk", "low"]);
const tone = z.enum(["good", "bad", "mixed", "calm"]);
const bounded = z.number().min(0).max(100);
const stats = z.object({ gpa: z.number().min(1.6).max(4.3), english: bounded, coding: bounded, research: bounded, project: bounded, papers: z.number().int().min(0).max(8), certs: z.number().int().min(0).max(10), network: bounded, stress: bounded, stamina: bounded });
const deltas = z.object(Object.fromEntries(Object.keys(stats.shape).map(k => [k, z.number().finite().optional()])));
const flags = z.object({
  hasAdvisor: z.boolean(), internDone: z.boolean(), internCount: nonnegative, burnoutCount: nonnegative, restCount: nonnegative, hackathonCount: nonnegative, paperAttempts: nonnegative,
  gpaActionsThisTerm: nonnegative, heavyThisTerm: nonnegative, burnedThisTerm: z.boolean(),
  actionCountsThisTerm: z.partialRecord(action, nonnegative).default({}), actionCounts: z.partialRecord(action, nonnegative).default({}),
  advisorTrack: advisorTrack.default("none"), projectTrack: projectTrack.default("none"), internTrack: internTrack.default("none"),
});
const event = z.object({ kicker: text, title: text, body: text, tone, deltas });
const need = z.object({ papers: nonnegative.optional(), intern: z.boolean().optional(), internTrack: z.enum(["swe", "lab", "pm"]).optional(), project: nonnegative.optional(), projectTrack: z.enum(["research", "product", "data"]).optional(), advisor: z.boolean().optional(), advisorTrack: z.enum(["academic", "builder", "manager"]).optional(), english: nonnegative.optional(), hackathon: nonnegative.optional(), certs: nonnegative.optional(), gpa: nonnegative.optional() });
const question = z.object({ prompt: text, options: z.array(z.object({ label: text, delta: z.number().finite(), weakDelta: z.number().finite(), reply: text, weakReply: text, need: need.optional() })).min(1).max(10) });
const school = z.object({ id: text, name: text, short: text, track: text, score: bounded, verdict, comment: text, estimate: z.literal(true), interviewed: z.boolean().optional() });
const run = z.object({ id: text, at: nonnegative, name: text, major, archetype, advisorTrack, internTrack, projectTrack, bestShort: text, bestScore: bounded, verdict, mateScore: bounded.nullable(), examScore: bounded, dossier: z.array(evidence).max(3), interviewDelta: z.number().finite(), interviewed: z.boolean() });
const schema = z.object({
  version: z.number().int().min(1).max(SAVE_VERSION),
  screen: z.enum(["title", "create", "play", "recap", "dossier", "interview", "result"]), gameActive: z.boolean(),
  profile: z.object({ name: z.string().max(12), major, archetype }).nullable(),
  phase: z.number().int().min(0).max(7), actionsLeft: z.number().int().min(0).max(3), stats, flags,
  journal: z.array(z.object({ id: text, phase: z.number().int().min(0).max(7), title: text, body: text, tone, deltas })).max(60),
  achievements: z.array(text).max(100), pendingEvent: event.nullable(),
  recap: z.object({ phase: z.number().int().min(0).max(6), title: text, body: text, notes: z.array(text).max(100), deltas, nextLabel: text, roommateNote: text.default(""), roommateActions: z.array(action).max(3).default([]) }).nullable(),
  admission: z.array(school).max(100).nullable(),
  roommate: z.object({ name: text, archetype, stats, hasAdvisor: z.boolean(), internDone: z.boolean(), papers: nonnegative.max(8), lastActions: z.array(action).max(3) }).nullable().default(null),
  dossier: z.array(evidence).max(3).default([]),
  interview: z.object({ schoolId: text, schoolShort: text, index: z.number().int().min(0).max(3), totalDelta: z.number().min(-14).max(16), questions: z.array(question).length(3), log: z.array(z.object({ prompt: text, pick: text, delta: z.number().finite(), supported: z.boolean() })).max(3).default([]) }).nullable().default(null),
  attribution: z.object({ lines: z.array(z.object({ label: text, detail: text })).max(100), roommateNote: text, nextTry: text }).nullable().default(null),
  history: z.array(run).max(20).default([]), seed: uint, rngState: uint, turn: nonnegative.int().max(21), startedAt: nonnegative.default(0),
});

/** Validate untrusted browser data before any game rule or UI indexes into it. */
export function parseSave(value: unknown): GameData | undefined {
  const result = schema.safeParse(value);
  if (!result.success) return undefined;
  const d = result.data;
  if (d.gameActive && !d.profile) return undefined;
  if (!["title", "create"].includes(d.screen) && (!d.profile || !d.gameActive)) return undefined;
  if (d.screen === "play" && d.phase > 6) return undefined;
  if (d.screen === "recap" && !d.recap) return undefined;
  if (d.screen === "result" && !d.admission?.length) return undefined;
  if (d.screen === "interview" && (!d.interview || d.interview.index >= d.interview.questions.length)) return undefined;
  if (new Set(d.dossier).size !== d.dossier.length) return undefined;
  return d as GameData;
}
