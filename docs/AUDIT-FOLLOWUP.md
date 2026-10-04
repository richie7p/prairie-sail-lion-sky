# PDF audit follow-up — 推甄養成

Baseline: portfolio audit dated 2026-10-03, pp. 25–26, commit `548bbd4cdca626c436671688d34c2a1a46ae328d`. Follow-up: 2026-10-04. Duplicate dependency findings are consolidated. No new audit score or production deployment is claimed.

| PDF finding | Implemented change and evidence | Remaining limit |
| --- | --- | --- |
| P1 Windows release entrypoint; lint errors | Wrapper executes the resolved Vite JS entrypoint with Node. Shared/engine lint errors corrected. Root `app-env.json` gives reproducible public app defaults while preserving platform/env overrides. Windows/Ubuntu CI runs the standard build. | Live deployment was not performed. |
| P2 engine lacks domain regression coverage | Added rule tests for action/stage guards, resource bounds, semester progression, dossier limits, interview evidence thresholds, finite/sorted estimates, complete endings, idempotent history, and save validation/migration. Found and fixed title/resume losing interview or result progress, impossible transitions and invalid option handling. | Tests cover documented boundaries and representative seeds; they are not exhaustive proof of every game balance combination. |
| P2 seed/time/replay consistency | Injected seed and start time; persisted the run timestamp. Normal starts use `crypto.getRandomValues`. Replaced random comparator sorting with seeded Fisher–Yates, so random consumption no longer depends on a JS sort implementation. Records use the persisted run start time. Seed zero stays valid during legacy roommate reconstruction. | Real starts intentionally use fresh entropy/time. Identical outcomes require the same seed, start time, profile, rule version and action sequence. Future rule changes require a migration/replay policy. |
| P2 admissions estimate misleading | Persistent UI explicitly says the model is fictional, uncalibrated and unsuitable for actual admissions decisions. Replaced authoritative-sounding school threshold prose with game-setting language. Creation asks for a fictional alias. | No institution calibration or user-comprehension study exists. Names and score weights are game content, not real selection criteria or probabilities. |
| P3 full flow / quota / private storage / mobile | Production-browser tests cover all seven semesters, dossier, all interview questions, endings, return/resume, clearing, legacy migration, malformed JSON and denied writes. Safe storage falls back in memory and shows a visible unsaved warning. Nested save schema rejects corrupt/future/inconsistent state. Clear-all erases history and browser storage. Event dialog focuses/traps/restores keyboard focus. | Physical mobile devices, all private-browser implementations, screen readers and long-running storage eviction remain external checks. Local storage is unencrypted and local only; avoid personal data. |
| P2 dependency advisory (listed twice) | Updated lock/dependencies; full-tree and production `npm audit` gates run on both CI operating systems. | Advisory results are point-in-time; no exploitability claim. |

## Save compatibility

Schema version 4 accepts valid older versions 1–3 and defaults newly introduced fields, including a zero/unknown start time for older runs. Invalid nested values or unsupported future versions reset to a safe title state. Unknown or absent timestamps do not pretend to record the historical completion time. Browser storage exceptions preserve current play in memory and warn the user that a reload may lose progress.

## Reproduction and counts

Node 22: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=high`, `npm audit --omit=dev --audit-level=high`. Then `npx playwright install chromium` and `npm run test:e2e` preview the production output at port 6343. No API key is needed.

Scaffold: 197 CLI/tooling + 55 shared app/auth tests. Domain: 22 tests, including four storage-failure tests. Browser: 6 tests (3 scenarios × desktop/mobile). Counts are separate because scaffold tests do not verify game rules. CI uses Ubuntu and Windows, with browser tests on Ubuntu; latest commit status is reported by the PR checks. Authoring tool tests use documented fixtures, not ignored developer files.
