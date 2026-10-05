#!/usr/bin/env node
/**
 * Wave planner and gate. Waves decide which agents run in parallel; the guard hook refuses a spawn that is not
 * in the open wave, so the order cannot be skipped.
 *   node wave.mjs plan --agents <type,type,...> [--mode build|change]
 *   node wave.mjs complete [--reported <file,file>] [--revert]   audit the open wave, then close it
 *   node wave.mjs start --agents <type,type,...>                 advisory mode only: record the wave's spawns by hand
 *   node wave.mjs status
 * Run from the session root (where .fullstack-builder/guard/config.json lives).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { unreadFor } from '../guard/lib/bus.mjs';
import { expandEntry, toMatcher } from '../guard/lib/scope.mjs';
import { checkpoint, countSpawns, currentRun, guardConfigFile, recordSpawn, runTier, withLock } from '../guard/lib/state.mjs';
import { applySpawn, completeInFlight, currentWave, evaluateSpawn, inFlight, loadPlan, loadState, savePlan, saveState } from '../guard/lib/waves.mjs';

const CANARY = 'guard-canary';
const CRITICS = ['a12-qa', 'a13-reviewer'];
const DEBUGGER = 'a14-debugger';
const CHANGE_WAVES = { debugger: 1, work: 2, critics: 3 };

const fail = (message) => {
  process.stderr.write(`wave: ${message}\n`);
  process.exit(1);
};

function load() {
  const sessionRoot = realpathSync(process.cwd());
  const file = guardConfigFile(sessionRoot);
  if (!existsSync(file)) fail('guard is not installed here. Run setup.mjs install <spec> first.');
  const config = JSON.parse(readFileSync(file, 'utf8'));
  const run = currentRun(join(sessionRoot, config.project_rel));
  if (!run) fail('no active run. Create one with new-run.sh first.');
  return { config, run };
}

function option(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

const staticPrefix = (entry) => entry.slice(0, entry.indexOf('*'));
const covers = (outer, inner) => inner === outer || inner.startsWith(outer.endsWith('/') ? outer : `${outer}/`);

function entriesOverlap(x, y) {
  if (x === '.' || y === '.') return true;
  const [xGlob, yGlob] = [x.includes('*'), y.includes('*')];
  if (!xGlob && !yGlob) return covers(x, y) || covers(y, x);
  if (xGlob && yGlob) return staticPrefix(x).startsWith(staticPrefix(y)) || staticPrefix(y).startsWith(staticPrefix(x));
  const [glob, literal] = xGlob ? [x, y] : [y, x];
  const segment = glob.split('/').filter(Boolean).pop().replace(/\*+/g, 'probe');
  const folder = literal.endsWith('/') ? literal : `${literal}/`;
  const probe = `${folder}${segment}${glob.endsWith('/') ? '/probe' : ''}`;
  return toMatcher(glob)(probe) || toMatcher(glob)(literal);
}

function profilesOverlap(a, b, runName) {
  const clean = (profile) => (profile.write ?? []).map((entry) => entry.replaceAll('{run}', runName));
  const bWrites = clean(b);
  return clean(a).some((x) => bWrites.some((y) => entriesOverlap(x, y)));
}

/** Greedy split: an agent whose write scope overlaps one already in the wave moves to a following wave. */
function splitOverlaps(types, config, runName) {
  const result = [];
  let pending = types;
  while (pending.length > 0) {
    const wave = [];
    const later = [];
    pending.forEach((type) => {
      const clash = wave.some((other) => profilesOverlap(config.profiles[type], config.profiles[other], runName));
      (clash ? later : wave).push(type);
    });
    result.push(wave);
    pending = later;
  }
  return result;
}

function wavesFor(types, mode, config) {
  const numbers = (type) => {
    if (mode === 'change') return [type === DEBUGGER ? CHANGE_WAVES.debugger : CRITICS.includes(type) ? CHANGE_WAVES.critics : CHANGE_WAVES.work];
    return config.profiles[type].waves ?? [3];
  };
  const byNumber = new Map();
  types.forEach((type) => numbers(type).forEach((n) => byNumber.set(n, [...(byNumber.get(n) ?? []), type])));
  return [...byNumber.keys()].sort((a, b) => a - b).flatMap((n) => splitOverlaps(byNumber.get(n), config, '__run__'));
}

function plan(argv) {
  const { config, run } = load();
  const types = (option(argv, '--agents') ?? '').split(',').filter(Boolean);
  const mode = option(argv, '--mode') ?? 'build';
  if (types.length === 0) fail('--agents is required (comma separated agent types)');
  if (!runTier(run.dir)) fail('no tier for this run. On a host with a hook, run the canary and guard-report.mjs --canary. On a host without one, run guard-report.mjs --tier advisory (or sequential).');
  if (!['build', 'change'].includes(mode)) fail('--mode must be build or change');
  const unknown = types.find((type) => type === CANARY || !config.agent_types.includes(type));
  if (unknown) fail(`"${unknown}" is not an agent type that can be planned`);
  const waves = wavesFor([...new Set(types)], mode, config);
  withLock(join(run.dir, '.lock'), () => {
    savePlan(run.dir, { mode, tier: runTier(run.dir), created: new Date().toISOString(), waves });
    saveState(run.dir, { started: {}, done: {} });
  });
  const planned = waves.flat().length;
  waves.forEach((wave, index) => process.stdout.write(`Wave ${index + 1} (parallel): ${wave.join(', ')}\n`));
  process.stdout.write(`${planned} planned agent calls, ${countSpawns(run.dir)} used, limit ${config.max_agent_calls}\n`);
  if (countSpawns(run.dir) + planned > config.max_agent_calls) process.stdout.write('WARN  the plan needs more agent calls than the limit allows\n');
}

/** Advisory mode (host without a pre-tool hook): no hook records spawns, so the PM records them here. */
function start(argv) {
  const { config, run } = load();
  const plan_ = loadPlan(run.dir);
  if (!plan_) fail('no wave plan. Run wave.mjs plan first.');
  if (runTier(run.dir) === 'enforced') fail('this run is enforced: the hook records spawns itself. wave.mjs start is for advisory and sequential runs only.');
  const types = (option(argv, '--agents') ?? '').split(',').filter(Boolean);
  if (types.length === 0) fail('--agents is required (comma separated agent types)');
  const projectAbs = join(config.session_root, config.project_rel);
  const ctx = { skillDir: config.skill_dir, projectAbs };
  const outcome = withLock(join(run.dir, '.lock'), () => {
    const state = loadState(run.dir);
    const verdicts = types.map((type) => ({ type, verdict: evaluateSpawn(plan_, state, type) }));
    const refused = verdicts.find((entry) => !entry.verdict.allow);
    if (refused) return { error: refused.verdict.reason };
    if (countSpawns(run.dir) + types.length > config.max_agent_calls) return { error: `agent call limit would be exceeded (limit ${config.max_agent_calls})` };
    if (existsSync(projectAbs) && inFlight(state).length === 0) checkpoint(ctx, 'wave');
    verdicts.forEach(({ type, verdict }) => {
      applySpawn(state, verdict);
      recordSpawn(run.dir, { type, description: 'advisory start' });
    });
    saveState(run.dir, state);
    return {};
  });
  if (outcome.error) fail(outcome.error);
  process.stdout.write(`Started: ${types.join(', ')}\n`);
}

function auditOpenWave(config, flying, argv) {
  const reported = option(argv, '--reported');
  const args = [join(config.skill_dir, 'scripts', 'scope-check.mjs'), '--agent', flying.join(',')];
  if (reported) args.push('--reported', reported);
  if (argv.includes('--revert')) args.push('--revert');
  return spawnSync('node', args, { encoding: 'utf8', cwd: config.session_root });
}

function complete(argv) {
  const { config, run } = load();
  const plan_ = loadPlan(run.dir);
  if (!plan_) fail('no wave plan. Run wave.mjs plan first.');
  const outcome = withLock(join(run.dir, '.lock'), () => closeOpenWave({ config, run, plan_, argv }));
  process.stdout.write(outcome.output);
  if (outcome.error) fail(outcome.error);
}

function closeOpenWave({ config, run, plan_, argv }) {
  const state = loadState(run.dir);
  const flying = [...new Set(inFlight(state).map((k) => k.slice(k.indexOf(':') + 1)))];
  if (flying.length === 0) return { output: '', error: 'no agents are in flight. Nothing to complete.' };
  const unread = flying.flatMap((type) => unreadFor(run.dir, type).map((m) => `${type} has not read ${m.key}`));
  if (unread.length > 0) return { output: '', error: `unread messages block completion (respawn the agent so it reads them, or reply):\n${unread.join('\n')}` };
  const audit = auditOpenWave(config, flying, argv);
  if (audit.status !== 0) return { output: audit.stdout, error: `scope audit failed for ${flying.join(', ')}. Wave stays open.` };
  const done = completeInFlight(state);
  saveState(run.dir, state);
  const open = currentWave(plan_, state);
  const next = open >= 0 ? `Next: wave ${open + 1} (${plan_.waves[open].join(', ')})` : 'All waves done.';
  return { output: `${audit.stdout}Completed: ${done.join(', ')}. ${next}\n` };
}

function status() {
  const { run } = load();
  const plan_ = loadPlan(run.dir);
  if (!plan_) return process.stdout.write('No wave plan yet.\n');
  const state = loadState(run.dir);
  const open = currentWave(plan_, state);
  plan_.waves.forEach((wave, index) => {
    const marks = wave.map((type) => `${type}${state.done[`${index}:${type}`] ? ' [done]' : state.started[`${index}:${type}`] ? ' [running]' : ''}`);
    process.stdout.write(`${index === open ? '>' : ' '} Wave ${index + 1}: ${marks.join(', ')}\n`);
  });
}

const [command, ...argv] = process.argv.slice(2);
if (command === 'plan') plan(argv);
else if (command === 'complete') complete(argv);
else if (command === 'start') start(argv);
else if (command === 'status') status();
else fail('usage: wave.mjs plan --agents <types> [--mode build|change] | complete [--reported files] [--revert] | start --agents <types> | status');
