/** Run state, logging, locking and checkpoints for the guard hook. */
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const RUN_NAME = /^[A-Za-z0-9._-]+$/;
const LOCK_ATTEMPTS = 60;
const LOCK_WAIT_MS = 50;
const STALE_LOCK_MS = 30_000;

/** Host-neutral home of the installed guard, relative to the session root. */
export const GUARD_HOME = ['.fullstack-builder', 'guard'];
export const guardConfigFile = (sessionRoot) => join(sessionRoot, ...GUARD_HOME, 'config.json');

/** Tier of a run: 'enforced' only with a canary.ok written by guard-report.mjs; otherwise whatever tier.json says. */
export const CANARY_VERIFIER = 'guard-report';
const readJsonFile = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};
export const canaryPassed = (runDir) => readJsonFile(join(runDir, 'canary.ok'))?.verified_by === CANARY_VERIFIER;
export const tierFile = (runDir) => join(runDir, 'tier.json');
export const runTier = (runDir) => (canaryPassed(runDir) ? 'enforced' : readJsonFile(tierFile(runDir))?.tier ?? null);

export const loadConfig = (guardDir) => JSON.parse(readFileSync(join(guardDir, 'config.json'), 'utf8'));

export function currentRun(projectAbs) {
  const pointer = join(projectAbs, 'docs', 'runs', 'CURRENT');
  if (!existsSync(pointer)) return null;
  const name = readFileSync(pointer, 'utf8').trim();
  const dir = join(projectAbs, 'docs', 'runs', name);
  return RUN_NAME.test(name) && existsSync(dir) ? { name, dir } : null;
}

export function writeLog(ctx, entry) {
  const target = ctx.run ? join(ctx.run.dir, 'guard-log.jsonl') : join(ctx.guardDir, 'logs', 'unattached.jsonl');
  mkdirSync(dirname(target), { recursive: true });
  appendFileSync(target, `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function acquireLock(lockDir) {
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
    try {
      mkdirSync(lockDir);
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() - statSync(lockDir).mtimeMs > STALE_LOCK_MS) rmSync(lockDir, { recursive: true, force: true });
      else sleep(LOCK_WAIT_MS);
    }
  }
  return false;
}

export function withLock(lockDir, action) {
  if (!acquireLock(lockDir)) throw new Error('could not acquire the guard lock');
  try {
    return action();
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

export function countSpawns(runDir) {
  const file = join(runDir, 'spawns.log');
  return existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean).length : 0;
}

export const recordSpawn = (runDir, entry) =>
  appendFileSync(join(runDir, 'spawns.log'), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);

/** Local git checkpoint so an agent's changes can be diffed and reverted. Throws on failure (fail closed). */
export function checkpoint(ctx, label) {
  const script = join(ctx.skillDir, 'scripts', 'checkpoint.sh');
  execFileSync('bash', [script, ctx.projectAbs, `before-${label}`], { stdio: 'pipe' });
}
