#!/usr/bin/env node
/**
 * Post-hoc audit: did the agent(s) change only files their guard profile allows? Compares the working tree
 * with the last checkpoint, so it also catches side effects of allowed shell commands. Run from the session root.
 *
 * Usage: node scope-check.mjs --agent <type>[,<type>...] [--reported <file,file>] [--allow-delete] [--revert]
 * Exit code: 0 clean, 1 violations, 2 usage error.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { decideWrite, expandEntry, isEnvFile, toMatcher } from '../guard/lib/scope.mjs';
import { GUARD_HOME, currentRun, guardConfigFile } from '../guard/lib/state.mjs';

const splitList = (text = '') => text.split(',').map((item) => item.trim()).filter(Boolean);
const git = (cwd, args) => execFileSync('git', ['-c', 'core.quotepath=off', ...args], { cwd, encoding: 'utf8' });

function usageError(message) {
  process.stderr.write(`${message}\nUsage: scope-check.mjs --agent <type>[,<type>] [--reported <files>] [--allow-delete] [--revert]\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = { agents: [], reported: null, revert: false, allowDelete: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--agent' || flag === '--agents') options.agents.push(...splitList(argv[(index += 1)]));
    else if (flag === '--reported') options.reported = splitList(argv[(index += 1)]);
    else if (flag === '--revert') options.revert = true;
    else if (flag === '--allow-delete') options.allowDelete = true;
    else usageError(`Unknown option ${flag}`);
  }
  if (options.agents.length === 0) usageError('--agent is required');
  return options;
}

function listChanges(cwd) {
  const tracked = git(cwd, ['diff', '--name-status', '--no-renames', 'HEAD']).split('\n').filter(Boolean).map((line) => {
    const [status, ...parts] = line.split('\t');
    return { path: parts.join('\t'), isDeleted: status === 'D', isUntracked: false };
  });
  const untracked = git(cwd, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
    .map((path) => ({ path, isDeleted: false, isUntracked: true }));
  return [...tracked, ...untracked];
}

function findTouchedEnvFiles(cwd) {
  const checkpointSeconds = Number(git(cwd, ['log', '-1', '--format=%ct']).trim());
  return git(cwd, ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory']).split('\n').filter(Boolean)
    .filter((path) => isEnvFile(basename(path)))
    .filter((path) => statSync(resolve(cwd, path)).mtimeMs / 1000 > checkpointSeconds)
    .map((path) => ({ path, type: 'protected (ignored env file touched)', canRevert: false }));
}

function revertChange(cwd, change) {
  const target = resolve(cwd, change.path);
  if (relative(cwd, target).startsWith('..')) return;
  if (change.isUntracked) rmSync(target, { force: true, recursive: true });
  else git(cwd, ['checkout', 'HEAD', '--', change.path]);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const sessionRoot = realpathSync(process.cwd());
  const config = JSON.parse(readFileSync(guardConfigFile(sessionRoot), 'utf8'));
  const projectAbs = join(sessionRoot, config.project_rel);
  const run = currentRun(projectAbs);
  const base = { projectRel: config.project_rel, runName: run?.name };
  const ctx = { ...base, protectedEntries: config.protected.map((entry) => expandEntry(entry, base)) };
  const unknown = options.agents.find((id) => !config.profiles[id]);
  if (unknown) usageError(`Unknown agent "${unknown}"`);
  const profile = { write: [...options.agents, 'pm'].flatMap((id) => config.profiles[id].write ?? []) };
  const managed = (config.guard_managed ?? []).map((entry) => toMatcher(expandEntry(entry, base)));

  const reportedSet = options.reported ? new Set(options.reported) : null;
  const changes = listChanges(projectAbs);
  const violations = [];
  for (const change of changes) {
    if (managed.some((matches) => matches(join(config.project_rel, change.path).split('\\').join('/')))) continue;
    const verdict = decideWrite({ rel: join(config.project_rel, change.path).split('\\').join('/'), profile, ctx });
    if (!verdict.allow) violations.push({ ...change, type: verdict.reason, canRevert: true });
    else if (change.isDeleted && !options.allowDelete) violations.push({ ...change, type: 'deletion not authorised', canRevert: true });
    else if (reportedSet && !reportedSet.has(change.path)) violations.push({ ...change, type: 'unreported change', canRevert: false });
  }
  violations.push(...findTouchedEnvFiles(projectAbs));
  if (reportedSet) {
    const changed = new Set(changes.map((change) => change.path));
    [...reportedSet].filter((path) => !changed.has(path)).forEach((path) => process.stdout.write(`WARN  reported but unchanged: ${path}\n`));
  }

  let reverted = 0;
  for (const violation of violations) {
    process.stdout.write(`VIOLATION ${violation.type}: ${violation.path}\n`);
    if (options.revert && violation.canRevert) {
      revertChange(projectAbs, violation);
      reverted += 1;
    }
  }
  if (violations.length === 0) return process.stdout.write(`CLEAN: ${changes.length} file(s) changed, all in scope\n`);
  process.stdout.write(`VIOLATIONS: ${violations.length}, reverted: ${reverted}\n`);
  process.exit(1);
}

main();
