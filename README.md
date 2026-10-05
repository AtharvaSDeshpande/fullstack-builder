# fullstack-builder

Spec-driven, multi-agent full-stack website builder and maintainer. Host-neutral: it is Markdown, Node scripts and JSON, so it is designed for any agent platform that can read a skill or instruction file and run shell commands. Only the Claude Code hook wiring is shipped and tested; for other platforms (for example Codex or Antigravity) you wire the hook yourself or run in advisory mode. How strongly scope is enforced depends on the host; see "Host support".

## Files
```
bootstrap.md                   separate skill: interviews the client like a PM, writes site.spec.json
SKILL.md                       the orchestrator (CRISP, standing instruction, feedback loop, 14 agents plus a canary)
guard/guard.mjs                the hook that checks every tool call of the PM and every subagent
guard/adapters.json            maps a host's tool names and hook fields to the guard's canonical ones
guard/lib/adapter.mjs          applies that mapping
AGENTS.md                      one-paragraph pointer for platforms that read AGENTS.md
guard/lib/*.mjs                path scope, shell allowlist, spawn limits, run state
guard/profiles.json            the one place that says what each agent may write, run and use
scripts/setup.mjs              `init` (spec templates) and `install <spec>` (hook, config, agent files)
scripts/guard-report.mjs       summary of blocks and spawns; `--canary` proves the hook is live
scripts/wave.mjs               plans parallel waves, audits and closes each wave
scripts/bus-report.mjs         shows agent-to-agent mail: open requests, blockers, unread
guard/lib/bus.mjs, waves.mjs   mail rules and wave state used by the hook
scripts/guard-selftest.mjs     replays 110 checks through the real hook, offline
scripts/validate-spec.mjs      validates a JSON spec (errors stop a run, warnings are logged)
scripts/new-run.sh             creates a unique run folder and run-log.md
scripts/close-run.sh           sets final status and adds a line to docs/runs/INDEX.md
scripts/checkpoint.sh          local git checkpoint (the guard runs it on every spawn)
scripts/scope-check.mjs        after each agent, flags (and can revert) changes outside its profile
templates/site.spec.json | .md    blank specs (copied by init) (JSON canonical, Markdown mapped 1:1)
templates/run-log.template.md  the per-run log
examples/site.spec.json        a complete, valid spec (a demo shop-ordering app)
```

## Use
1. Copy this folder into your platform's skills (or instructions) folder, under a path with no spaces, for example `~/.claude/skills/fullstack-builder/` for Claude Code; check your platform's docs for its folder. To use the interview skill, also copy `bootstrap.md` as `bootstrap/SKILL.md` next to it. A platform with no skill folder can be pointed at `SKILL.md` directly.
2. Either `Run bootstrap` (a PM interview that writes `site.spec.json` for you), or `Run fullstack-builder init` and fill in `site.spec.json` (or `.md`). Your `acceptance` list is the rubric the build is judged on.
3. `Run fullstack-builder build from site.spec.json`
4. Later: `Run fullstack-builder fix <problem>` (also add, change, improve).

Requires Node 18+, npm, git, internet for `npm install`, and an agent platform that can run shell commands. Sub-agents and a pre-tool-call hook are needed for full enforcement (see Host support). `sha256sum` or `shasum` must be on the PATH.
The skill folder path must not contain spaces or shell-special characters (the guard rejects them); install it somewhere like `~/skills/fullstack-builder/`.
The files in `templates/` are blank on purpose and fail `validate-spec.mjs` until filled in; `examples/site.spec.json` is the valid reference.

## Host support
| Tier | Host offers | Result |
|---|---|---|
| 1. Enforced | pre-tool-call hook (also for sub-agents) with agent identity | full guard: blocks, canary, wave gate, mail gate |
| 2. Advisory | sub-agents, no hook | briefs, profiles, post-hoc `scope-check` and revert; nothing is blocked live |
| 3. Sequential | neither | one agent plays each role in turn, same audits, no parallel waves or mail |

`node scripts/setup.mjs install <spec> [--host auto|claude-code|generic]` writes the guard to `.fullstack-builder/` in every case. `claude-code` also wires `.claude/settings.json` and `.claude/agents/`; `generic` prints the steps to wire the hook into another platform. Tool names are canonical (`Read`, `Write`, `Edit`, `Bash`, `Agent`, ...); add a host's own names to `guard/adapters.json` after checking its documentation. Only the `claude-code` wiring is shipped; for other hosts the hook wiring is yours to do, and the run reports which tier it ran in.

## Guardrails
Scope is enforced by a script, not by prompts. `setup.mjs install` installs `guard.mjs` under `.fullstack-builder/guard/`, wires it as a pre-tool-call hook (tier 1), which runs for every subagent too, and generates agent files with tool allowlists. Subagents cannot spawn, cannot write outside their profile, and can only run allowlisted commands. A canary agent proves the hook is live before any real agent runs.
Agents run in parallel waves (the hook refuses a spawn outside the open wave) and talk to each other through write-once message files; the hook blocks an agent's next write or command until it has read mail addressed to it.
First install: the host may need one restart to see the new agent files, and some hosts require the workspace to be trusted.
Check it yourself: `node scripts/guard-selftest.mjs`.
Limits: it controls tool calls, not code your project runs; it is not a container sandbox; `.env` files are blocked from agents but only flagged (not reverted) by the audit.
To change what an agent may do, edit `guard/profiles.json` and rerun `setup.mjs install`.
Every run writes `<project>/docs/runs/<timestamp>-<slug>/run-log.md`.

## Sample application: OffPeak Gym

`sample-application/offpeak-gym/` is a real project produced by this skill on Antigravity, kept in the repo so you can see what the workflow leaves behind. It is a two-sided marketplace where freelance personal trainers book boutique-gym bays by the hour and gym hosts see a payout ledger (React + Vite + MUI front end, Express + SQLite back end, Razorpay and Twilio with sandbox fallbacks). Its own README is `sample-application/offpeak-gym/ReadMe.md`. To try it: `npm install`, `cp .env.example .env`, `npm run seed`, then `npm run server` and `npm run dev`. `npm test` runs 13 tests and `npm run build` succeeds.

### How it maps to the workflow

| Workflow step | Where to look in the sample |
|---|---|
| Spec (the single source of truth) | `site.spec.json`, the acceptance list in it, and `docs/spec.lock.json` (identical to the spec at the last run) |
| Contracts the agents share | `docs/CONTRACTS.md`, `docs/TRACEABILITY.md` (feature to files and tests) |
| One run per request | `docs/runs/<timestamp>-<slug>/run-log.md`, indexed in `docs/runs/INDEX.md` |
| Waves | `waves.json` (the plan) and `wave-state.json` (when each agent started and finished) in each run folder |
| Guard evidence | `guard-log.jsonl` (every block and allow), `spawns.log` (agent calls), `canary.ok` |
| Critique loop and human gate | section 8 of each run log (PASS/FAIL with evidence per criterion) and section 15 (human decision) |
| Product code, one folder per feature | `src/features/<feature-id>/`, each with an `index.js` boundary |

### The runs

One BUILD run and eight CHANGE runs, all in one project folder, in order:

| Run | Mode | Request in short | Agent calls |
|---|---|---|---|
| `build-offpeak-gym` | build | Build the app from the spec (US pilot, Stripe) | 15 |
| `add-razorpay` | change | Replace Stripe with Razorpay | 6 |
| `india-localization` | change | Switch currency, prices and city to India | 9 |
| `pune-city-fixes` | change | Fix price and map issues, move the pilot to Pune | 9 |
| `remove-google-maps` | change | Remove the Google Maps key, use a keyless radar map | 5 |
| `fix-price-currency` | change | Fix currency inconsistencies | 5 |
| `unify-all-pricing` | change | Second pass: one price source end to end | 5 |
| `price-breakup-clarity` | change | Show a price breakup wherever two values appear | 4 |
| `add-readme` | change | Write the project README | 3 |

The sequence shows the loop working as designed: each human reply ("one more pass, prices still inconsistent") becomes a new run with its own plan, rubric, waves and log, and the spec is updated to match (Stripe to Razorpay, USD to INR, Austin to Pune).

### What the evidence does and does not show

Read the logs with these limits in mind:

- **Only the first two runs have a live-guard record.** `build-offpeak-gym` and `add-razorpay` contain `guard-log.jsonl` and `spawns.log`. They show the canary being blocked on 2 forbidden writes and 1 forbidden command, its one permitted write succeeding, and the agent calls counted. They record nothing for the specialist agents' own writes.
- **Later runs were audited by hand, not by the hook.** Runs 3 to 9 have no guard log, and the canary file in runs 3 to 7 is a hand-written note rather than the output of `guard-report.mjs --canary`. Treat them as advisory-mode runs (see Host support): the wave and status records exist, but nothing was blocked live.
- **Some logged work falls outside the agent profiles.** For example, run logs credit `a11-content` with edits to `src/App.jsx` and feature components, and `a3-hourly-booking` with edits to `src/App.jsx`. Under `guard/profiles.json` those paths belong to other agents, so a live guard would have blocked or rerouted them.
- **Run records are incomplete in places.** The first run was never closed (status "in progress") and the first two runs are missing from `docs/runs/INDEX.md`. Every run ends with "Pending human decision" even though the next run shows the human replied.
- **The sample was built with an earlier layout.** The first run's context list reads `.claude/guard/`, the old guard location (it is now `.fullstack-builder/guard/`). The skill name in the run requests was renamed to `fullstack-builder` after the fact.

Use the sample to see the shape of the artefacts and the product the workflow produced. Do not read it as proof of enforcement; for that, run `node scripts/guard-selftest.mjs` and the canary on a host that supports hooks.
