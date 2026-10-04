#!/usr/bin/env node
/**
 * Setup for fullstack-builder.
 *   node setup.mjs init              copy blank spec templates into the current folder
 *   node setup.mjs install <spec> [--host auto|claude-code|generic]
 *                                    install the guard (hook, config, agent definitions) into ./.fullstack-builder
 * Run it from the folder where your agent platform runs (the session root).
 * The guard itself is host-neutral. A host adapter only wires it into one platform's hook settings:
 *   claude-code  also writes .claude/settings.json (PreToolUse hook) and .claude/agents/*.md
 *   generic      writes nothing outside .fullstack-builder and prints how to wire the hook yourself
 *   auto         claude-code when ./.claude exists or CLAUDECODE is set, otherwise generic
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const SAFE_PATH = /^[A-Za-z0-9_./@:=+,-]+$/;
const FEATURE_ID = /^[a-z0-9][a-z0-9-]*$/;
const GUARD_REL = '.fullstack-builder/guard';
const HOSTS = ['claude-code', 'generic'];
const HOOK_MARKER = `/${GUARD_REL}/guard.mjs`;
const CLAUDE_HOOK_COMMAND = `node "$CLAUDE_PROJECT_DIR/${GUARD_REL}/guard.mjs"`;
const GUARD_FILES = ['guard.mjs', 'lib/scope.mjs', 'lib/bash.mjs', 'lib/state.mjs', 'lib/bus.mjs', 'lib/waves.mjs', 'lib/adapter.mjs'];
const SOURCE_LANGUAGE = 'en';
const TEMPLATES = ['site.spec.json', 'site.spec.md'];

const fail = (message) => {
  process.stderr.write(`setup: ${message}\n`);
  process.exit(1);
};
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const CLAUDE_NEXT = 'Next: accept the workspace trust prompt if shown, restart the host if the new agents are not listed, then run guard-selftest.mjs.\n';
const GENERIC_NEXT = [
  'Next, wire the guard into your platform (setup cannot do this for an unknown host):',
  `  1. Register \`node ${GUARD_REL}/guard.mjs\` as a hook that runs before every tool call, for the main agent and every sub-agent.`,
  '     It reads {tool_name, tool_input, cwd, agent_id, agent_type} as JSON on stdin; exit code 2 blocks the call.',
  '     If your platform names tools or fields differently, add an adapter to guard/adapters.json and rerun install.',
  '  2. Register the agent definitions in .fullstack-builder/agents/ as sub-agents, if your platform supports them.',
  '  3. Run guard-selftest.mjs, then the canary. If your platform has no pre-tool hook, use advisory mode (see SKILL.md, HOST SUPPORT).',
  '',
].join('\n');

function runInit() {
  TEMPLATES.forEach((name) => {
    const target = name;
    if (existsSync(target)) return process.stdout.write(`kept existing ${target}\n`);
    copyFileSync(join(SKILL_DIR, 'templates', name), target);
    process.stdout.write(`created ${target}\n`);
  });
  process.stdout.write('Fill in one spec (JSON or Markdown). See examples/site.spec.json for a complete one.\n');
}

const featuresTagged = (spec, tag) => spec.features.filter((feature) => (feature.tags ?? []).includes(tag));
const plainFeatures = (spec) => spec.features.filter((feature) => !['auth', 'search'].some((tag) => (feature.tags ?? []).includes(tag)));
const featureWrites = (id) => [`src/features/${id}/`, `src/locales/en/${id}.json`];

function writesFor(template, spec, mode) {
  const tagged = template.tag ? featuresTagged(spec, template.tag).flatMap((feature) => featureWrites(feature.id)) : [];
  const byMode = mode === 'mock' ? template.write_mock : mode === 'real' ? template.write_real : undefined;
  return [...new Set([...(template.write ?? []), ...tagged, ...(byMode ?? [])])];
}

const outboxFor = (id) => `docs/runs/{run}/bus/outbox/${id}/`;
const otherLanguages = (spec) => spec.languages.supported.filter((lang) => lang !== SOURCE_LANGUAGE);
const expandLanguages = (writes, spec) =>
  writes.flatMap((entry) => (entry.includes('{lang}') ? otherLanguages(spec).map((lang) => entry.replaceAll('{lang}', lang)) : [entry]));

function withOutbox(id, profile) {
  return id === 'pm' || id === 'guard-canary' ? profile : { ...profile, write: [...profile.write, outboxFor(id)] };
}

function buildProfiles(templates, spec) {
  const mode = spec.stack.backend.mode;
  const profiles = {};
  for (const [id, template] of Object.entries(templates)) {
    if (template.per_feature) {
      plainFeatures(spec).forEach((feature) => {
        const id = `a3-${feature.id}`;
        profiles[id] = withOutbox(id, {
          ...template,
          write: template.write.map((entry) => entry.replaceAll('{feature}', feature.id)),
          job: `${template.job}: ${feature.name}`,
        });
      });
    } else {
      const write = id === 'pm' || id === 'guard-canary' ? template.write : expandLanguages(writesFor(template, spec, mode), spec);
      profiles[id] = withOutbox(id, { ...template, write });
    }
  }
  return profiles;
}

function agentFile(id, profile) {
  const tools = profile.tools === '*' ? [] : profile.tools;
  return [
    '---',
    `name: ${id}`,
    `description: ${JSON.stringify(`${profile.role}. ${profile.job}. Spawn only when the PM briefs it.`)}`,
    `tools: ${tools.join(', ')}`,
    '---',
    `You are the ${profile.role}. Your single job: ${profile.job}.`,
    'Your file writes and shell commands are limited by hooks that you cannot change. A blocked call is final: report what you needed and why, do not look for a way around it.',
    'Mail: the PM and other agents leave you messages in the bus/outbox folders of the current run (the PM tells you the run folder). The guard blocks your writes and commands until you have read any message addressed to you, so read it when told. Before you start and before you finish, Glob the outbox folders for files named *-to-<your type>-* or *-to-all-*.',
    'To message someone, create a NEW file with Write at <run folder>/bus/outbox/<your type>/NNN-to-<agent type, pm or all>-<kind>.md (NNN is your own counter: 001, 002, ...). Kinds: info, request (you need something), reply (you answer), blocker (you cannot continue), decision (an interface others rely on). Under 4000 characters, plain words. Messages cannot be edited or overwritten.',
    'Reply in under 150 words with: Files changed, Observed (not changed), Assumptions, Needs from other agents, How to verify.',
    '',
  ].join('\n');
}

function mergeSettings(settingsPath) {
  const settings = existsSync(settingsPath) ? readJson(settingsPath) : {};
  const hooks = settings.hooks ?? {};
  const others = (hooks.PreToolUse ?? []).filter((entry) => !JSON.stringify(entry).includes(HOOK_MARKER));
  hooks.PreToolUse = [...others, { matcher: '*', hooks: [{ type: 'command', command: CLAUDE_HOOK_COMMAND, timeout: 30 }] }];
  writeFileSync(settingsPath, `${JSON.stringify({ ...settings, hooks }, null, 2)}\n`);
}

function resolveHost(argv, sessionRoot) {
  const index = argv.indexOf('--host');
  const asked = index >= 0 ? argv[index + 1] : 'auto';
  if (asked !== 'auto' && !HOSTS.includes(asked)) fail(`--host must be auto, ${HOSTS.join(' or ')}`);
  if (asked !== 'auto') return asked;
  return existsSync(join(sessionRoot, '.claude')) || process.env.CLAUDECODE ? 'claude-code' : 'generic';
}

function runInstall(argv) {
  const specPath = argv[0];
  if (!specPath || !existsSync(specPath)) fail('usage: setup.mjs install <spec.json> [--host auto|claude-code|generic] (run from the session root)');
  if (!SAFE_PATH.test(SKILL_DIR)) fail(`skill path "${SKILL_DIR}" has characters the guard cannot allow. Move the skill to a simple path.`);
  const check = spawnSync('node', [join(SKILL_DIR, 'scripts', 'validate-spec.mjs'), specPath], { encoding: 'utf8' });
  if (check.status !== 0) fail(`the spec is invalid:\n${check.stdout}`);
  const spec = readJson(specPath);
  const badFeature = spec.features.find((feature) => !FEATURE_ID.test(feature.id));
  if (badFeature) fail(`feature id "${badFeature.id}" must be lowercase letters, digits and hyphens`);

  const template = readJson(join(SKILL_DIR, 'guard', 'profiles.json'));
  const sessionRoot = realpathSync(process.cwd());
  const host = resolveHost(argv, sessionRoot);
  const adapters = readJson(join(SKILL_DIR, 'guard', 'adapters.json')).adapters;
  const guardDir = join(sessionRoot, GUARD_REL);
  const profiles = buildProfiles(template.profiles, spec);
  const config = {
    version: 1,
    host,
    adapter: adapters[host],
    session_root: sessionRoot,
    project_rel: spec.project.slug,
    skill_dir: SKILL_DIR,
    max_agent_calls: spec.constraints?.max_agent_calls ?? template.max_agent_calls_default,
    forbidden_packages: [...(spec.constraints?.forbidden_packages ?? []), ...(spec.constraints?.libraries_forbidden ?? [])],
    protected: template.protected,
    guard_managed: template.guard_managed,
    agent_types: Object.keys(profiles).filter((id) => id !== 'pm'),
    profiles,
  };
  config.bus_recipients = [...config.agent_types.filter((id) => id !== 'guard-canary'), 'pm', 'all'];

  mkdirSync(join(guardDir, 'lib'), { recursive: true });
  GUARD_FILES.forEach((file) => copyFileSync(join(SKILL_DIR, 'guard', file), join(guardDir, file)));
  writeFileSync(join(guardDir, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
  const agentDirs = [join(sessionRoot, '.fullstack-builder', 'agents')];
  if (host === 'claude-code') {
    mkdirSync(join(sessionRoot, '.claude'), { recursive: true });
    mergeSettings(join(sessionRoot, '.claude', 'settings.json'));
    agentDirs.push(join(sessionRoot, '.claude', 'agents'));
  }
  agentDirs.forEach((dir) => {
    mkdirSync(dir, { recursive: true });
    config.agent_types.forEach((id) => writeFileSync(join(dir, `${id}.md`), agentFile(id, profiles[id])));
  });

  process.stdout.write(`Guard installed in ${guardDir} (host: ${host})\n`);
  process.stdout.write(`${config.agent_types.length} guarded agent types, max ${config.max_agent_calls} agent calls per run, project folder ./${spec.project.slug}\n`);
  process.stdout.write(host === 'claude-code' ? CLAUDE_NEXT : GENERIC_NEXT);
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'init') runInit();
else if (command === 'install') runInstall(rest);
else fail('usage: setup.mjs init | setup.mjs install <spec.json> [--host auto|claude-code|generic]');
