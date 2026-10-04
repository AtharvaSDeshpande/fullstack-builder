/**
 * Bash allowlist. A command is allowed only if every token is plain (no quotes, pipes, redirects, globs,
 * substitutions) AND the whole command matches a rule of one of the agent's rule groups.
 */
import { basename, isAbsolute } from 'node:path';
import { isEnvFile, relativeToRoot } from './scope.mjs';

const ARG = '[A-Za-z0-9_./@:=+,-]+';
const PKG = '@?[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9._-]+)?(?:@[A-Za-z0-9._-]+)?';
const TOKEN = new RegExp(`^${ARG}$`);
const DANGEROUS_OPTION = /^--(output|exec|ext-diff|textconv|upload-pack|receive-pack)/;
const MAX_COMMAND_LENGTH = 400;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const RULE_GROUPS = {
  'readonly-git': ['^git (?:status|diff|log|show)(?: (?:-[a-zA-Z]|--[a-z-]+(?:={ARG})?|{ARG}))*$'],
  'npm-view': ['^npm view {PKG}(?: [a-z.]+)?$'],
  'project-checks': ['^npm --prefix {PROJECT} (?:run (?:lint|test|build)|test)(?: -- --run)?$'],
  'run-app': ['^npm --prefix {PROJECT} run dev$'],
  'install-deps': ['^npm --prefix {PROJECT} install$'],
  'architect-setup': [
    '^npm create vite@latest {PROJECTNAME}(?: -- --template react(?:-ts)?)?$',
    '^npm --prefix {PROJECT} install(?: (?:--save-dev|-D))?(?: {PKG})+$',
    '^npm --prefix {PROJECT} run msw:init$',
  ],
  'pm-scripts': [
    '^node {SKILL}/scripts/(?:validate-spec|scope-check|guard-report|guard-selftest|setup|wave|bus-report)\\.mjs(?: {ARG})*$',
    '^bash {SKILL}/scripts/(?:new-run|close-run|checkpoint)\\.sh(?: {ARG})+$',
    '^(?:sha256sum|shasum -a 256) {ARG}$',
    '^date$',
  ],
};

function placeholders(ctx) {
  const project = [escapeRegex(ctx.projectAbs), ctx.projectRel ? escapeRegex(ctx.projectRel) : '\\.'];
  return {
    PROJECT: `(?:${project.join('|')})`,
    PROJECTNAME: escapeRegex(ctx.projectRel),
    SKILL: escapeRegex(ctx.skillDir),
    ARG,
    PKG,
  };
}

const compileRule = (source, values) =>
  new RegExp(source.replace(/\{([A-Z]+)\}/g, (_, name) => values[name]));

function tokenProblem(token, ctx) {
  if (!TOKEN.test(token)) return 'shell syntax, quotes and wildcards are not permitted';
  if (DANGEROUS_OPTION.test(token)) return 'this option can write files';
  if (token.split('/').includes('..')) return 'parent paths (..) are not permitted';
  if (isEnvFile(basename(token))) return 'env files are off limits';
  if (isAbsolute(token)) {
    const isSkillPath = token === ctx.skillDir || token.startsWith(`${ctx.skillDir}/`);
    if (!isSkillPath && relativeToRoot(ctx.sessionRoot, token, ctx.cwd) === null) {
      return 'absolute path outside the project';
    }
  }
  return null;
}

const packageName = (token) => token.replace(/^(@?[^@]+)@.*$/, '$1');

export function decideBash({ profile, command, ctx }) {
  if (typeof command !== 'string' || command.trim() === '') return { allow: false, reason: 'empty command' };
  if (command.length > MAX_COMMAND_LENGTH) return { allow: false, reason: 'command too long' };
  const tokens = command.split(' ');
  for (const token of tokens) {
    const problem = token === '' ? 'unusual spacing' : tokenProblem(token, ctx);
    if (problem) return { allow: false, reason: `${problem}: "${token}"` };
  }
  const groups = profile.bash ?? [];
  const values = placeholders(ctx);
  const rules = groups.flatMap((group) => RULE_GROUPS[group] ?? []).map((source) => compileRule(source, values));
  if (!rules.some((rule) => rule.test(command))) {
    return { allow: false, reason: `not on this agent's command allowlist (groups: ${groups.join(', ') || 'none'})` };
  }
  const forbidden = ctx.forbiddenPackages.find((name) => tokens.slice(1).some((token) => packageName(token) === name));
  if (forbidden) return { allow: false, reason: `package "${forbidden}" is forbidden by the spec` };
  return { allow: true };
}
