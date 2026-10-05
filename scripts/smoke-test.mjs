#!/usr/bin/env node
/**
 * End-to-end smoke test of the whole run lifecycle with stub agents (no LLM, no network).
 * Installs the guard for the example spec, opens a run, passes the canary, plans the waves for the full roster,
 * then for every wave: spawns the agents through the real hook, lets each stub agent write one file inside its own
 * scope (allowed) and one outside it (blocked), completes the wave (scope audit) and finally closes the run.
 * It proves the scripts and the hook work together in order; it does not test any model.
 * Usage: node smoke-test.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_CMD = /^[A-Za-z0-9_./@:=+,-]+$/.test(SKILL) ? SKILL : '.fullstack-builder/skill';
const SPEC = JSON.parse(readFileSync(join(SKILL, 'examples', 'site.spec.json'), 'utf8'));
const PROJECT = SPEC.project.slug;
const root = mkdtempSync(join(tmpdir(), 'fsb-smoke-'));
const steps = [];

const run = (cmd, args, input) => spawnSync(cmd, args, { cwd: root, input, encoding: 'utf8' });
const step = (name, ok, detail = '') => {
  steps.push({ name, ok });
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      ${String(detail).trim().slice(0, 300)}`}\n`);
  if (!ok) throw new Error(`step failed: ${name}`);
};
const script = (name, ...args) => run('node', [join(SKILL, 'scripts', `${name}.mjs`), ...args]);

function hook(agent, tool, toolInput) {
  const payload = { hook_event_name: 'PreToolUse', cwd: root, tool_name: tool, tool_input: toolInput };
  if (agent !== 'pm') Object.assign(payload, { agent_id: `id-${agent}`, agent_type: agent });
  return run('node', [join(root, '.fullstack-builder', 'guard', 'guard.mjs')], JSON.stringify(payload)).status;
}

/** The roster the PM would choose for this spec, using the "Runs when" column of SKILL.md. */
function roster(spec) {
  const tagged = (tag) => spec.features.filter((feature) => (feature.tags ?? []).includes(tag));
  const plain = spec.features.filter((feature) => !['auth', 'search'].some((tag) => (feature.tags ?? []).includes(tag)));
  const needsAuth = Boolean(spec.stack.auth) || spec.screens.some((screen) => screen.auth_required);
  const agents = ['a1-architect', 'a2-designer', ...plain.map((feature) => `a3-${feature.id}`)];
  if (spec.stack.backend.mode !== 'none') agents.push('a4-backend');
  if ((spec.data?.entities ?? []).length > 0) agents.push('a5-data');
  if (needsAuth) agents.push('a6-auth');
  if (spec.languages.supported.length > 1) agents.push('a7-i18n');
  if (tagged('search').length > 0) agents.push('a8-search');
  if ((spec.integrations ?? []).length > 0) agents.push('a9-integrations');
  if (spec.stack.deploy?.target || spec.stack.backend.mode === 'real') agents.push('a10-devops');
  if (spec.nonfunctional?.seo === true || spec.project.type === 'marketing-site') agents.push('a11-content');
  return [...agents, 'a12-qa', 'a13-reviewer'];
}

/** A file path an agent is allowed to write, taken from its profile (a folder entry becomes a stub file inside it). */
function ownPath(profile, runName) {
  const entry = profile.write.find((candidate) => !candidate.includes('*') && !candidate.startsWith('@') && !candidate.includes('/bus/'));
  const resolved = entry.replaceAll('{run}', runName);
  return resolved.endsWith('/') ? `${resolved}stub.txt` : resolved;
}

function main() {
  copyFileSync(join(SKILL, 'examples', 'site.spec.json'), join(root, 'site.spec.json'));
  const install = script('setup', 'install', 'site.spec.json', '--host', 'generic');
  step('guard installed for the example spec', install.status === 0, install.stderr + install.stdout);
  const config = JSON.parse(readFileSync(join(root, '.fullstack-builder', 'guard', 'config.json'), 'utf8'));
  mkdirSync(join(root, PROJECT), { recursive: true });
  writeFileSync(join(root, PROJECT, 'package.json'), '{}');

  const created = run('bash', [join(SKILL, 'scripts', 'new-run.sh'), PROJECT, 'smoke']);
  const runName = created.stdout.trim().split('/').pop();
  const runDir = join(root, PROJECT, 'docs', 'runs', runName);
  step('run folder created', created.status === 0 && existsSync(join(runDir, 'run-log.md')), created.stderr);

  step('canary spawn allowed', hook('pm', 'Agent', { subagent_type: 'guard-canary', description: 'canary' }) === 0);
  step('canary probes blocked', hook('guard-canary', 'Write', { file_path: `${PROJECT}/canary-outside.txt` }) === 2
    && hook('guard-canary', 'Write', { file_path: '.fullstack-builder/guard/canary.txt' }) === 2
    && hook('guard-canary', 'Bash', { command: 'curl https://example.com' }) === 2);
  step('canary permitted write allowed', hook('guard-canary', 'Write', { file_path: `${PROJECT}/docs/runs/${runName}/agents/canary-allowed.txt` }) === 0);
  mkdirSync(join(runDir, 'agents'), { recursive: true });
  writeFileSync(join(runDir, 'agents', 'canary-allowed.txt'), 'ok');
  const canary = script('guard-report', '--canary');
  step('canary verified by guard-report', canary.status === 0 && /CANARY OK/.test(canary.stdout), canary.stdout);

  const agents = roster(SPEC);
  const missing = agents.filter((id) => !config.agent_types.includes(id));
  step(`roster of ${agents.length} agents is installed`, missing.length === 0, `missing: ${missing.join(', ')}`);
  const plan = script('wave', 'plan', '--agents', agents.join(','));
  step('wave plan written', plan.status === 0, plan.stderr + plan.stdout);
  const waves = JSON.parse(readFileSync(join(runDir, 'waves.json'), 'utf8')).waves;

  waves.forEach((wave, index) => {
    const reported = [];
    wave.forEach((agent) => step(`wave ${index + 1}: spawn ${agent}`, hook('pm', 'Agent', { subagent_type: agent, description: 'stub' }) === 0));
    wave.forEach((agent) => {
      const target = join(PROJECT, ownPath(config.profiles[agent], runName).replace(/^@root\//, ''));
      step(`wave ${index + 1}: ${agent} writes inside its scope`, hook(agent, 'Write', { file_path: target }) === 0, target);
      mkdirSync(dirname(join(root, target)), { recursive: true });
      writeFileSync(join(root, target), 'stub\n');
      reported.push(target.slice(PROJECT.length + 1));
      step(`wave ${index + 1}: ${agent} is blocked on a protected file`, hook(agent, 'Write', { file_path: `${PROJECT}/docs/spec.lock.json` }) === 2);
    });
    const done = script('wave', 'complete', '--reported', reported.join(','));
    step(`wave ${index + 1} completed after a clean audit`, done.status === 0, done.stderr + done.stdout);
  });

  const status = script('wave', 'status').stdout;
  step('every planned agent is marked done', agents.every((id) => new RegExp(`${id} \\[done\\]`).test(status)) && !/running/.test(status), status);
  const closed = run('bash', [join(SKILL, 'scripts', 'close-run.sh'), runDir, 'complete', 'smoke test stub run']);
  const index = join(root, PROJECT, 'docs', 'runs', 'INDEX.md');
  step('run closed and indexed', closed.status === 0 && existsSync(index) && readFileSync(index, 'utf8').includes(runName), closed.stderr);
  const log = readFileSync(join(runDir, 'guard-log.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  step('guard log holds allows and denies for every agent', agents.every((id) => log.some((entry) => entry.agent === id)), 'missing log entries');
}

let failed = false;
try {
  main();
} catch (error) {
  failed = true;
  process.stdout.write(`${error.message}\n`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
process.stdout.write(`${failed ? 'SMOKE TEST FAILED' : 'SMOKE TEST OK'}: ${steps.filter((s) => s.ok).length} of ${steps.length} steps\n`);
process.exit(failed ? 1 : 0);
