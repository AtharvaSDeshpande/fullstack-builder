/** Path rules shared by the live guard hook and the post-hoc scope-check. Pure functions, no side effects. */
import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const ENV_EXAMPLE = '.env.example';
const ROOT_PREFIX = '@root/';
const NO_RUN = '__no_active_run__';

export const toPosix = (path) => path.split(sep).join('/');

/** Resolves symlinks on the nearest existing ancestor so a link cannot carry a path out of the root. */
export function resolveReal(absolutePath) {
  let current = absolutePath;
  const tail = [];
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) break;
    tail.unshift(basename(current));
    current = parent;
  }
  const base = existsSync(current) ? realpathSync(current) : current;
  return join(base, ...tail);
}

/** Returns the posix path relative to the session root, or null when the target is outside it. */
export function relativeToRoot(sessionRoot, filePath, cwd) {
  if (typeof filePath !== 'string' || filePath === '' || filePath.includes('\0')) return null;
  const absolute = isAbsolute(filePath) ? resolve(filePath) : resolve(cwd, filePath);
  const rel = relative(realpathSync(sessionRoot), resolveReal(absolute));
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  return toPosix(rel);
}

/** A file, a folder prefix ("src/theme/") or a glob ("**\/__tests__/", "**\/*.test.js"). */
export function toMatcher(entry) {
  if (entry === '.') return () => true;
  if (!entry.includes('*')) {
    return (file) => file === entry || file.startsWith(entry.endsWith('/') ? entry : `${entry}/`);
  }
  const source = entry
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(.*/)?')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  const regex = new RegExp(`^${source}${entry.endsWith('/') ? '.*' : ''}$`);
  return (file) => regex.test(file);
}

/** Turns a profile entry into a session-root-relative entry. "@root/" entries are already relative to it. */
export function expandEntry(entry, { projectRel, runName }) {
  const withRun = entry.replaceAll('{run}', runName ?? NO_RUN);
  if (withRun.startsWith(ROOT_PREFIX)) return withRun.slice(ROOT_PREFIX.length);
  return projectRel ? `${projectRel}/${withRun}` : withRun;
}

export function isEnvFile(rel) {
  const name = basename(rel);
  return name.startsWith('.env') && name !== ENV_EXAMPLE;
}

const isInside = (entry, protectedEntry) =>
  protectedEntry.endsWith('/') ? entry.startsWith(protectedEntry) : entry === protectedEntry;

export function findProtectedEntry(rel, protectedEntries) {
  return protectedEntries.find((entry) => toMatcher(entry)(rel));
}

export function decideWrite({ rel, profile, ctx }) {
  if (rel === null) return { allow: false, reason: 'path is outside the project root' };
  if (isEnvFile(rel)) return { allow: false, reason: 'env files are off limits' };
  const writes = (profile.write ?? []).map((entry) => expandEntry(entry, ctx));
  const protectedEntry = findProtectedEntry(rel, ctx.protectedEntries);
  if (protectedEntry && !writes.some((entry) => isInside(entry, protectedEntry))) {
    return { allow: false, reason: `protected path (${protectedEntry})` };
  }
  if (writes.length === 0) return { allow: false, reason: 'this agent is read-only' };
  if (!writes.some((entry) => toMatcher(entry)(rel))) {
    return { allow: false, reason: `outside this agent's allowed paths (${(profile.write ?? []).join(', ')})` };
  }
  return { allow: true };
}
