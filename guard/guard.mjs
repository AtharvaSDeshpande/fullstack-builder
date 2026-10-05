#!/usr/bin/env node
/**
 * Pre-tool-call hook. Runs on every tool call of the main session and of every sub-agent, so no agent
 * can talk its way past it. Exit 0 = allow. Exit 2 = block (the reason is shown to the agent).
 * Any error blocks too (fail closed): hosts treat other exit codes as "continue".
 * Input: JSON on stdin, normalised by lib/adapter.mjs using the adapter stored in config.json.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeInput } from './lib/adapter.mjs';
import { decideBash } from './lib/bash.mjs';
import { decideWrite, expandEntry, isEnvFile, relativeToRoot } from './lib/scope.mjs';
import { busWriteProblem, markRead, outboxDir, unreadFor } from './lib/bus.mjs';
import { canaryPassed, checkpoint, countSpawns, currentRun, loadConfig, recordSpawn, withLock, writeLog } from './lib/state.mjs';
import { applySpawn, evaluateSpawn, inFlight, loadPlan, loadState, saveState } from './lib/waves.mjs';

const GUARD_DIR = dirname(fileURLToPath(import.meta.url));
const CANARY = 'guard-canary';
const WRITE_TOOLS = { Write: 'file_path', Edit: 'file_path', MultiEdit: 'file_path', NotebookEdit: 'notebook_path' };
const READ_TOOLS = { Read: 'file_path', Glob: 'path', Grep: 'path' };
const SPAWN_TOOLS = ['Agent', 'Task'];
const LOGGED_ALLOWS = [...Object.keys(WRITE_TOOLS), 'Bash', ...SPAWN_TOOLS];
const READ_ONLY = { tools: ['Read', 'Grep', 'Glob'], write: [], bash: [] };
const ALLOW = { allow: true };
const MAIL_BLOCKED_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash'];
const MAX_LISTED_MESSAGES = 5;
const deny = (reason) => ({ allow: false, reason });

function buildContext(config, input) {
  const sessionRoot = realpathSync(config.session_root);
  const projectAbs = join(sessionRoot, config.project_rel);
  const run = existsSync(projectAbs) ? currentRun(projectAbs) : null;
  const base = { sessionRoot, projectAbs, projectRel: config.project_rel, runName: run?.name };
  return {
    ...base,
    run,
    config,
    guardDir: GUARD_DIR,
    skillDir: config.skill_dir,
    cwd: input.cwd ?? sessionRoot,
    forbiddenPackages: config.forbidden_packages ?? [],
    protectedEntries: config.protected.map((entry) => expandEntry(entry, base)),
  };
}

function identify(config, input) {
  if (!input.agent_id) return { name: 'pm', profile: config.profiles.pm };
  const name = input.agent_type ?? 'unknown';
  return { name, profile: config.profiles[name] ?? READ_ONLY };
}

function decideRead(ctx, profile, path) {
  if (path === undefined) return ALLOW;
  const rel = relativeToRoot(ctx.sessionRoot, path, ctx.cwd);
  const isSkillPath = profile.read_skill && (path === ctx.skillDir || path.startsWith(`${ctx.skillDir}/`));
  if (rel === null && !isSkillPath) return deny('reading outside the project is not permitted');
  if (rel !== null && isEnvFile(rel)) return deny('env files are off limits');
  return ALLOW;
}

function decideSpawn(ctx, input) {
  if (input.agent_id) return deny('sub-agents may not spawn agents');
  const type = input.tool_input?.subagent_type;
  if (!ctx.config.agent_types.includes(type)) {
    return deny(`"${type}" is not a guarded agent type. Use one of: ${ctx.config.agent_types.join(', ')}`);
  }
  if (!ctx.run) return deny('no active run. Create one with scripts/new-run.sh first');
  if (type !== CANARY && !canaryPassed(ctx.run.dir)) {
    return deny('the guard canary has not passed for this run');
  }
  return withLock(join(ctx.run.dir, '.lock'), () => {
    const used = countSpawns(ctx.run.dir);
    const limit = ctx.config.max_agent_calls;
    if (used >= limit) return deny(`agent call limit reached (${used} of ${limit}). Only the human can raise it`);
    if (type === CANARY) return recordAndAllow(ctx, type, input);
    const plan = loadPlan(ctx.run.dir);
    if (!plan) return deny('no wave plan for this run. Create it with scripts/wave.mjs plan first');
    const state = loadState(ctx.run.dir);
    const verdict = evaluateSpawn(plan, state, type);
    if (!verdict.allow) return deny(verdict.reason);
    if (existsSync(ctx.projectAbs) && inFlight(state).length === 0) checkpoint(ctx, type);
    applySpawn(state, verdict);
    saveState(ctx.run.dir, state);
    return recordAndAllow(ctx, type, input);
  });
}

function recordAndAllow(ctx, type, input) {
  recordSpawn(ctx.run.dir, { type, description: input.tool_input?.description ?? '' });
  return ALLOW;
}

function unreadMailProblem(ctx, who) {
  const unread = unreadFor(ctx.run.dir, who.name).slice(0, MAX_LISTED_MESSAGES);
  if (unread.length === 0) return null;
  const list = unread.map((m) => `${m.path} (from ${m.from}, ${m.kind})`).join('; ');
  return `you have unread messages. Read them with the Read tool before doing anything else: ${list}`;
}

function busWriteDecision(ctx, input, who, rel) {
  const abs = join(ctx.sessionRoot, rel);
  if (!abs.startsWith(`${outboxDir(ctx.run.dir)}/`)) return null;
  const problem = busWriteProblem({
    tool: input.tool_name,
    abs,
    content: input.tool_input?.content,
    sender: who.name,
    recipients: ctx.config.bus_recipients,
    runDir: ctx.run.dir,
  });
  return problem ? deny(problem) : null;
}

function decide(ctx, input, who) {
  const tool = input.tool_name;
  const toolInput = input.tool_input ?? {};
  const { profile } = who;
  if (profile.tools !== '*' && !profile.tools.includes(tool)) return deny(`tool ${tool} is not permitted for this agent`);
  if (input.agent_id && ctx.run && MAIL_BLOCKED_TOOLS.includes(tool)) {
    const unread = unreadMailProblem(ctx, who);
    if (unread) return deny(unread);
  }
  if (tool in WRITE_TOOLS) {
    const rel = relativeToRoot(ctx.sessionRoot, toolInput[WRITE_TOOLS[tool]], ctx.cwd);
    const busVerdict = rel !== null && ctx.run ? busWriteDecision(ctx, input, who, rel) : null;
    return busVerdict ?? decideWrite({ rel, profile, ctx });
  }
  if (tool in READ_TOOLS) return decideRead(ctx, profile, toolInput[READ_TOOLS[tool]]);
  if (tool === 'Bash') return decideBash({ profile, command: toolInput.command, ctx });
  if (SPAWN_TOOLS.includes(tool)) return decideSpawn(ctx, input);
  if ((ctx.config.passthrough_tools ?? []).includes(tool)) return ALLOW;
  return deny(`tool ${tool} is not recognised by the guard. Map it in guard/adapters.json or list it in passthrough_tools, then rerun setup.mjs install`);
}

function recordReceipt(ctx, input, who) {
  if (!input.agent_id || !ctx.run || input.tool_name !== 'Read') return;
  const rel = relativeToRoot(ctx.sessionRoot, input.tool_input?.file_path, ctx.cwd);
  const abs = rel === null ? '' : join(ctx.sessionRoot, rel);
  const prefix = `${outboxDir(ctx.run.dir)}/`;
  if (abs.startsWith(prefix)) markRead(ctx.run.dir, who.name, abs.slice(prefix.length));
}

const targetOf = (input) => {
  const toolInput = input.tool_input ?? {};
  return String(toolInput.file_path ?? toolInput.notebook_path ?? toolInput.command ?? toolInput.subagent_type ?? toolInput.path ?? '').slice(0, 200);
};

function main() {
  const raw = JSON.parse(readFileSync(0, 'utf8'));
  const config = loadConfig(GUARD_DIR);
  const input = normalizeInput(raw, config.adapter);
  const ctx = buildContext(config, input);
  const who = identify(config, input);
  const decision = decide(ctx, input, who);
  if (!decision.allow || LOGGED_ALLOWS.includes(input.tool_name)) {
    writeLog(ctx, {
      agent: who.name,
      agent_id: input.agent_id ?? null,
      tool: input.tool_name,
      target: targetOf(input),
      decision: decision.allow ? 'ALLOW' : 'DENY',
      reason: decision.reason ?? '',
    });
  }
  if (decision.allow) recordReceipt(ctx, input, who);
  if (!decision.allow) {
    process.stderr.write(`[guard] BLOCKED (${who.name}): ${decision.reason}. This is final; do not try to work around it. Report it instead.\n`);
    process.exit(2);
  }
  process.exit(0);
}

try {
  main();
} catch (error) {
  process.stderr.write(`[guard] error, blocking (fail closed): ${error.message}\n`);
  process.exit(2);
}
