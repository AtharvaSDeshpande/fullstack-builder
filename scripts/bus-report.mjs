#!/usr/bin/env node
/**
 * Shows the agent message bus for the current run: who wrote to whom, unread mail, open requests and blockers.
 * Usage (from the session root): node bus-report.mjs
 * "Answered" is a heuristic: a request counts as answered when the recipient later posted a reply or decision to the sender.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { BROADCAST, PM, listMessages, unreadFor } from '../guard/lib/bus.mjs';
import { currentRun, guardConfigFile } from '../guard/lib/state.mjs';

const ANSWER_KINDS = ['reply', 'decision'];

function main() {
  const sessionRoot = realpathSync(process.cwd());
  const configFile = guardConfigFile(sessionRoot);
  if (!existsSync(configFile)) throw new Error('guard is not installed here');
  const config = JSON.parse(readFileSync(configFile, 'utf8'));
  const run = currentRun(join(sessionRoot, config.project_rel));
  if (!run) throw new Error('no active run');
  const messages = listMessages(run.dir);
  process.stdout.write(`Messages: ${messages.length}\n`);
  const pairs = new Map();
  messages.forEach((m) => pairs.set(`${m.from} -> ${m.to}`, (pairs.get(`${m.from} -> ${m.to}`) ?? 0) + 1));
  pairs.forEach((count, pair) => process.stdout.write(`  ${pair}: ${count}\n`));

  const answered = (request) => messages.some((m) => ANSWER_KINDS.includes(m.kind) && m.from !== request.from
    && (request.to === BROADCAST || m.from === request.to) && (m.to === request.from || m.to === BROADCAST) && m.mtimeMs >= request.mtimeMs);
  const open = messages.filter((m) => m.kind === 'request' && !answered(m));
  const blockers = messages.filter((m) => m.kind === 'blocker' && !messages.some((r) => ANSWER_KINDS.includes(r.kind) && r.to === m.from && r.mtimeMs >= m.mtimeMs));
  const agents = [...new Set(messages.flatMap((m) => [m.from, m.to]).filter((a) => a !== BROADCAST && a !== PM))];
  const unread = agents.flatMap((agent) => unreadFor(run.dir, agent).map((m) => `${agent} has not read ${m.key}`));
  messages.filter((m) => m.to === PM).forEach((m) => process.stdout.write(`FOR PM ${m.kind}: ${m.path}\n`));
  open.forEach((m) => process.stdout.write(`OPEN REQUEST ${m.key}\n`));
  blockers.forEach((m) => process.stdout.write(`OPEN BLOCKER ${m.key}\n`));
  unread.forEach((line) => process.stdout.write(`UNREAD ${line}\n`));
  if (!open.length && !blockers.length && !unread.length) process.stdout.write('No open requests, blockers or unread mail.\n');
}

try {
  main();
} catch (error) {
  process.stderr.write(`bus-report: ${error.message}\n`);
  process.exit(1);
}
