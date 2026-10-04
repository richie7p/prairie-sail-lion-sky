import assert from "node:assert/strict";
import { test } from "node:test";
import { actionLockReason, advanceSemester, answerInterview, clampStats, defaultStats, dismissEvent, evaluateAdmission, normalizeSave, optionSupported, performAction, replaceEvidence, resumeScreen, startGame, submitDossier, titleData, toggleEvidence } from "../../src/lib/game/engine";
import { createRng, rngNext } from "../../src/lib/game/rng";
import { SAVE_VERSION, type ActionId, type GameData, type Profile } from "../../src/lib/game/types";
const profile: Profile = { name: "測試角色", major: "cs", archetype: "balanced" };
const start = (seed=42) => startGame(profile, [], { seed, startedAt: 12345 });
function playToDossier(seed: number) {
  let d = start(seed);
  for (let term=0; term<7; term++) {
    for (const wanted of ["gpa", "project", "rest"] as ActionId[]) {
      d = performAction(d, actionLockReason(d, wanted) ? "rest" : wanted).data;
      d = dismissEvent(d);
    }
    assert.equal(d.screen, "recap");
    d = advanceSemester(d);
  }
  assert.equal(d.screen, "dossier");
  return d;
}
function finish(seed: number) {
  let d = submitDossier(playToDossier(seed));
  for (let i=0; i<3 && d.screen === "interview"; i++) d = answerInterview(d, 0);
  assert.equal(d.screen, "result");
  return d;
}
test("PRNG is reproducible and can resume from its serialized state", () => {
  const a=createRng(42), b=createRng(42);
  for(let i=0;i<100;i++) assert.equal(a.next(),b.next());
  assert.equal(a.next(), rngNext(b.getState()).value);
});
test("identical seed, profile, time and actions reproduce full game including ending", () => {
  for(const seed of [0,1,42,0xffffffff]) assert.deepEqual(finish(seed),finish(seed));
});
test("different seeds can generate different roommate/action paths", () => {
  assert.notDeepEqual(finish(1),finish(100));
});
test("actions only run in play and cannot bypass event acknowledgement", () => {
  const fresh=titleData(); assert.equal(performAction(fresh,"gpa").data,fresh);
  const d=performAction(start(),"gpa").data;
  assert.equal(d.actionsLeft,2); assert.equal(d.turn,1);
  assert.equal(performAction(d,"rest").data,d);
});
test("phase cannot advance before all three actions and recap", () => {
  const d=start(); assert.equal(advanceSemester(d),d);
});
test("internship, paper and stamina prerequisites reject premature actions", () => {
  const d=start(); assert.ok(actionLockReason(d,"intern")); assert.ok(actionLockReason(d,"submit"));
  const tired={...d,stats:{...d.stats,stamina:0}};
  assert.ok(actionLockReason(tired,"gpa")); assert.equal(actionLockReason(tired,"rest"),null);
});
test("stats are bounded after extreme deltas", () => {
  const s=clampStats({...defaultStats(),gpa:100,english:-20,papers:100,stress:500,stamina:-1});
  assert.equal(s.gpa,4.3);assert.equal(s.english,0);assert.equal(s.papers,8);assert.equal(s.stress,100);assert.equal(s.stamina,0);
});
test("dossier only accepts unlocked, distinct evidence up to three", () => {
  let d={...start(),screen:"dossier" as const,stats:{...start().stats,project:80,english:80,certs:2}};
  d=toggleEvidence(d,"transcript") as typeof d;d=toggleEvidence(d,"project") as typeof d;d=toggleEvidence(d,"english") as typeof d;
  assert.equal(toggleEvidence(d,"cert"),d);assert.equal(toggleEvidence(d,"paper"),d);
  assert.equal(replaceEvidence(d,"transcript","project"),d);
  assert.deepEqual(replaceEvidence(d,"transcript","cert").dossier,["cert","project","english"]);
});
test("empty dossier and invalid interview choices do not advance", () => {
  const d={...start(),screen:"dossier" as const};assert.equal(submitDossier(d),d);
  const iv=submitDossier(playToDossier(42));
  assert.equal(answerInterview(iv,-1),iv);assert.equal(answerInterview(iv,999),iv);assert.equal(answerInterview(iv,NaN),iv);
});
test("interview evidence support changes exactly at required thresholds", () => {
  const d=start();assert.equal(optionSupported(d,{project:d.stats.project}),true);
  assert.equal(optionSupported(d,{project:d.stats.project+1}),false);
  assert.equal(optionSupported(d,{advisor:true}),false);
});
test("admission values are bounded estimates and sorted by score", () => {
  const rows=evaluateAdmission(start());
  assert.ok(rows.length>0);
  rows.forEach((r,i)=>{assert.equal(r.estimate,true);assert.ok(r.score>=8&&r.score<=97);if(i)assert.ok(rows[i-1]!.score>=r.score);});
});
test("returning to title preserves resumable interview and result stages", () => {
  const ended=finish(42); assert.equal(resumeScreen({...ended,screen:"title"}),"result");
  const d=submitDossier({...playToDossier(42),stats:{...defaultStats(),gpa:4.3,english:100,research:100,coding:100,project:100,papers:8}});
  assert.equal(d.screen,"interview");assert.equal(resumeScreen({...d,screen:"title"}),"interview");
});
test("save and restore midway reproduce the remaining game", () => {
  const d=dismissEvent(performAction(start(),"project").data);
  const restored=normalizeSave(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(restored,d);
  assert.deepEqual(performAction(restored,"rest"),performAction(d,"rest"));
});
test("version 3 migrates missing v4 timestamp while preserving progress and seed zero", () => {
  const old: Record<string, unknown>={...start(0),version:3};delete old.startedAt;
  const d=normalizeSave(old);assert.equal(d.version,SAVE_VERSION);assert.equal(d.startedAt,0);assert.equal(d.seed,0);assert.equal(d.profile?.name,profile.name);
});
test("legacy missing roommate is rebuilt from seed zero rather than a fallback seed", () => {
  const original = start(0);
  assert.deepEqual(normalizeSave({ ...original, version: 1, roommate: null }).roommate, original.roommate);
});
test("corrupt nested values, future versions and impossible screens reset safely", () => {
  const cases: unknown[]=[null,[],{...start(),version:99},{...start(),phase:999999999},{...start(),stats:{...defaultStats(),gpa:NaN}},{...start(),profile:{...profile,major:"unknown"}},{...start(),history:[{}]},{...start(),screen:"interview",interview:null},{...start(),dossier:["transcript","transcript"]}];
  for(const c of cases)assert.deepEqual(normalizeSave(c),titleData());
});
test("completion is idempotent and history does not duplicate", () => {
  const d=finish(42);assert.equal(d.history.length,1);assert.equal(submitDossier(d),d);assert.equal(answerInterview(d,0),d);
});
test("valid completed saves survive nested validation", () => {
  const d:GameData=finish(42);assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(d))),d);
});
