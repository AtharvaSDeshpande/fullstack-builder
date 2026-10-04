#!/usr/bin/env node
/**
 * Summarises what the guard allowed and blocked in the current run, or verifies the canary.
 * Usage (from the session root): node guard-report.mjs [--canary]
 * --canary proves the hook is firing: it checks the canary agent's probes were blocked, its one allowed
 * write went through, no forbidden file exists, then writes canary.ok. Without canary.ok no agent can be spawned.
 */
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GUARD_HOME, currentRun, guardConfigFile } from '../guard/lib/state.mjs';

const CANARY = 'guard-canary';
const OUTSIDE_FILE = 'canary-outside.txt';
const ALLOWED_FILE = 'canary-allowed.txt';

const fail = (message) => {
  process.stdout.write(`${message}\n`);
  process.exit(1);
};

const readLines = (file) => (existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []);

function summarise(log, spawns, config) {
  const byAgent = {};
  for (const entry of log) {
    const row = (byAgent[entry.agent] ??= { allowed: 0, denied: 0, reasons: new Set() });
    if (entry.decision === 'ALLOW') row.allowed += 1;
    else {
      row.denied += 1;
      row.reasons.add(`${entry.tool}: ${entry.reason}`);
    }
  }
  process.stdout.write(`Agent calls: ${spawns.length} of ${config.max_agent_calls}\n`);
  for (const [agent, row] of Object.entries(byAgent)) {
    process.stdout.write(`${agent}: ${row.allowed} allowed, ${row.denied} blocked\n`);
    row.reasons.forEach((reason) => process.stdout.write(`  blocked: ${reason}\n`));
  }
  if (log.length === 0) process.stdout.write('No guard activity logged for this run.\n');
}

function verifyCanary({ log, spawns, run, projectAbs, sessionRoot }) {
  const probes = log.filter((entry) => entry.agent === CANARY);
  const denied = (tool) => probes.filter((entry) => entry.decision === 'DENY' && entry.tool === tool).length;
  const allowedWrites = probes.filter((entry) => entry.decision === 'ALLOW' && entry.tool === 'Write' && entry.target.endsWith(ALLOWED_FILE));
  if (!spawns.some((entry) => entry.type === CANARY)) fail('CANARY FAILED: the canary agent was never spawned.');
  if (probes.length === 0) fail('CANARY FAILED: the guard logged nothing for the canary. The hook is not firing (not trusted, not loaded, or node missing).');
  if (denied('Write') < 2) fail('CANARY FAILED: expected at least 2 blocked writes from the canary.');
  if (denied('Bash') < 1) fail('CANARY FAILED: expected at least 1 blocked shell command from the canary.');
  if (allowedWrites.length < 1) fail('CANARY FAILED: the canary\'s one permitted write was not allowed, so agent identity is not being recognised.');
  const forbidden = [join(projectAbs, OUTSIDE_FILE), join(sessionRoot, OUTSIDE_FILE), join(sessionRoot, ...GUARD_HOME, 'canary.txt')];
  const leaked = forbidden.find((file) => existsSync(file));
  if (leaked) fail(`CANARY FAILED: a forbidden file exists: ${leaked}`);
  if (!existsSync(join(run.dir, 'agents', ALLOWED_FILE))) fail('CANARY FAILED: the permitted canary file was not created.');
  writeFileSync(join(run.dir, 'canary.ok'), `${JSON.stringify({ passed_at: new Date().toISOString() })}\n`);
  process.stdout.write('CANARY OK: the guard blocked every probe and allowed the permitted one. Agents may now be spawned.\n');
}

function main() {
  const sessionRoot = realpathSync(process.cwd());
  const configFile = guardConfigFile(sessionRoot);
  if (!existsSync(configFile)) fail('Guard is not installed here. Run setup.mjs install <spec> first.');
  const config = JSON.parse(readFileSync(configFile, 'utf8'));
  const projectAbs = join(sessionRoot, config.project_rel);
  const run = existsSync(projectAbs) ? currentRun(projectAbs) : null;
  if (!run) fail('No active run. Create one with new-run.sh first.');
  const log = readLines(join(run.dir, 'guard-log.jsonl'));
  const spawns = readLines(join(run.dir, 'spawns.log'));
  if (process.argv.includes('--canary')) return verifyCanary({ log, spawns, run, projectAbs, sessionRoot });
  summarise(log, spawns, config);
}

main();
