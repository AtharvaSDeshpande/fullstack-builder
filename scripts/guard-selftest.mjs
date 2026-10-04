#!/usr/bin/env node
/**
 * Offline self-test of the guard: installs it into a throwaway folder, replays tool calls through the real hook
 * and checks every verdict. It proves the rules, not that your host fires the hook; the canary proves that.
 * Usage: node guard-selftest.mjs
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeInput } from '../guard/lib/adapter.mjs';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let root = mkdtempSync(join(tmpdir(), 'guard-selftest-'));
const roots = [root];
const PROJECT = JSON.parse(readFileSync(join(SKILL, 'examples', 'site.spec.json'), 'utf8')).project.slug;
const results = [];
let runName = '';

const run = (cmd, args, cwd, input) => spawnSync(cmd, args, { cwd, input, encoding: 'utf8' });

function call(agent, tool, toolInput) {
  const payload = { hook_event_name: 'PreToolUse', cwd: root, tool_name: tool, tool_input: toolInput };
  if (agent !== 'pm') Object.assign(payload, { agent_id: `id-${agent}`, agent_type: agent });
  return run('node', [join(root, '.fullstack-builder', 'guard', 'guard.mjs')], root, JSON.stringify(payload)).status;
}

function expect(name, agent, tool, toolInput, verdict) {
  const status = call(agent, tool, toolInput);
  const actual = status === 0 ? 'allow' : status === 2 ? 'deny' : `exit ${status}`;
  results.push({ name: `${agent} ${name}`, ok: actual === verdict, actual, verdict });
}

function setUp(limit = 3) {
  const spec = JSON.parse(readFileSync(join(SKILL, 'examples', 'site.spec.json'), 'utf8'));
  spec.constraints.max_agent_calls = limit;
  spec.constraints.forbidden_packages = ['moment'];
  writeFileSync(join(root, 'site.spec.json'), JSON.stringify(spec));
  const install = run('node', [join(SKILL, 'scripts', 'setup.mjs'), 'install', 'site.spec.json', '--host', 'generic'], root);
  if (install.status !== 0) throw new Error(`install failed: ${install.stderr}${install.stdout}`);
  mkdirSync(join(root, PROJECT, 'src', 'theme'), { recursive: true });
  writeFileSync(join(root, PROJECT, 'package.json'), '{}');
  const created = run('bash', [join(SKILL, 'scripts', 'new-run.sh'), PROJECT, 'selftest'], root);
  runName = created.stdout.trim().split('/').pop();
  symlinkSync(tmpdir(), join(root, PROJECT, 'src', 'theme', 'escape'));
}

function projectAndPathCases() {
  const w = (path) => ({ file_path: path });
  const runDir = `${PROJECT}/docs/runs/${runName}`;
  expect('writes docs/CONTRACTS.md', 'pm', 'Write', w(`${PROJECT}/docs/CONTRACTS.md`), 'allow');
  expect('cannot write product code', 'pm', 'Write', w(`${PROJECT}/src/features/cart/x.js`), 'deny');
  expect('cannot edit the spec', 'pm', 'Edit', w('site.spec.json'), 'deny');
  expect('writes normalized spec', 'pm', 'Write', w('site.spec.normalized.json'), 'allow');
  expect('writes spec.lock.json', 'pm', 'Write', w(`${PROJECT}/docs/spec.lock.json`), 'allow');
  expect('writes run-log.md', 'pm', 'Write', w(`${runDir}/run-log.md`), 'allow');
  expect('cannot forge canary.ok', 'pm', 'Write', w(`${runDir}/canary.ok`), 'deny');
  expect('cannot edit guard settings', 'pm', 'Write', w('.claude/settings.json'), 'deny');
  expect('cannot edit guard config', 'pm', 'Write', w('.fullstack-builder/guard/config.json'), 'deny');
  expect('cannot edit other host config', 'pm', 'Write', w('.codex/config.toml'), 'deny');
  expect('writes in its theme folder', 'a2-designer', 'Write', w(`${PROJECT}/src/theme/t.js`), 'allow');
  expect('edits in its theme folder', 'a2-designer', 'Edit', w(`${PROJECT}/src/theme/t.js`), 'allow');
  expect('blocked outside its folders', 'a2-designer', 'Write', w(`${PROJECT}/src/features/cart/x.js`), 'deny');
  expect('blocked from package.json', 'a2-designer', 'Write', w(`${PROJECT}/package.json`), 'deny');
  expect('blocked from parent path', 'a2-designer', 'Write', w('../outside.txt'), 'deny');
  expect('blocked via symlink escape', 'a2-designer', 'Write', w(`${PROJECT}/src/theme/escape/x.txt`), 'deny');
  expect('blocked from the guard folder', 'a2-designer', 'Write', w('.fullstack-builder/guard/config.json'), 'deny');
  expect('blocked from .env', 'a2-designer', 'Write', w(`${PROJECT}/.env`), 'deny');
  expect('blocked from reading .env', 'a2-designer', 'Read', w(`${PROJECT}/.env`), 'deny');
  expect('may read project files', 'a2-designer', 'Read', w(`${PROJECT}/package.json`), 'allow');
  expect('cannot read outside root', 'a2-designer', 'Read', w('/etc/passwd'), 'deny');
  expect('writes its feature folder', 'a3-cart', 'Write', w(`${PROJECT}/src/features/cart/Cart.jsx`), 'allow');
  expect('writes its English strings', 'a3-cart', 'Write', w(`${PROJECT}/src/locales/en/cart.json`), 'allow');
  expect('blocked from other feature', 'a3-cart', 'Write', w(`${PROJECT}/src/features/orders/x.js`), 'deny');
  expect('blocked from Hindi strings', 'a3-cart', 'Write', w(`${PROJECT}/src/locales/hi/cart.json`), 'deny');
  expect('writes search feature', 'a8-search', 'Write', w(`${PROJECT}/src/features/search/x.js`), 'allow');
  expect('writes only in agents folder', 'a13-reviewer', 'Write', w(`${runDir}/agents/review.md`), 'allow');
  expect('cannot touch product code', 'a13-reviewer', 'Write', w(`${PROJECT}/src/App.jsx`), 'deny');
  expect('unknown type cannot write', 'general-purpose', 'Write', w(`${PROJECT}/src/x.js`), 'deny');
  expect('unknown type may read', 'general-purpose', 'Read', w(`${PROJECT}/package.json`), 'allow');
}

function commandAndSpawnCases() {
  const b = (command) => ({ command });
  expect('runs spec validator', 'pm', 'Bash', b(`node ${SKILL}/scripts/validate-spec.mjs site.spec.json`), 'allow');
  expect('runs new-run.sh', 'pm', 'Bash', b(`bash ${SKILL}/scripts/new-run.sh ${PROJECT} fix-x`), 'allow');
  expect('runs the build', 'pm', 'Bash', b(`npm --prefix ${PROJECT} run build`), 'allow');
  expect('blocked rm', 'pm', 'Bash', b(`rm -rf ${PROJECT}`), 'deny');
  expect('blocked chaining', 'pm', 'Bash', b(`npm --prefix ${PROJECT} run build && rm -rf x`), 'deny');
  expect('blocked redirect', 'pm', 'Bash', b(`echo hi > ${PROJECT}/src/x.js`), 'deny');
  expect('blocked cat .env', 'pm', 'Bash', b(`cat ${PROJECT}/.env`), 'deny');
  expect('blocked git push', 'pm', 'Bash', b('git push'), 'deny');
  expect('runs lint', 'a2-designer', 'Bash', b(`npm --prefix ${PROJECT} run lint`), 'allow');
  expect('reads git status', 'a2-designer', 'Bash', b('git status'), 'allow');
  expect('blocked package install', 'a2-designer', 'Bash', b(`npm --prefix ${PROJECT} install left-pad`), 'deny');
  expect('blocked quoted commit', 'a2-designer', 'Bash', b('git commit -m "x"'), 'deny');
  expect('blocked git diff --output', 'a2-designer', 'Bash', b('git diff --output=x'), 'deny');
  expect('blocked from spawning', 'a2-designer', 'Agent', { subagent_type: 'a3-cart' }, 'deny');
  expect('blocked web fetch', 'a2-designer', 'WebFetch', { url: 'https://example.com' }, 'deny');
  expect('installs allowed package', 'a1-architect', 'Bash', b(`npm --prefix ${PROJECT} install react-router-dom`), 'allow');
  expect('blocked forbidden package', 'a1-architect', 'Bash', b(`npm --prefix ${PROJECT} install moment@2.0.0`), 'deny');
  expect('writes vite config', 'a1-architect', 'Write', { file_path: `${PROJECT}/vite.config.js` }, 'allow');
  expect('unknown type cannot run shell', 'general-purpose', 'Bash', b('git status'), 'deny');
  expect('blocked unguarded agent type', 'pm', 'Agent', { subagent_type: 'general-purpose' }, 'deny');
  expect('blocked spawn before canary', 'pm', 'Agent', { subagent_type: 'a2-designer' }, 'deny');
}

function canaryFlow() {
  const runDir = join(root, PROJECT, 'docs', 'runs', runName);
  expect('canary spawn allowed', 'pm', 'Agent', { subagent_type: 'guard-canary', description: 'canary' }, 'allow');
  expect('probe outside write', 'guard-canary', 'Write', { file_path: `${PROJECT}/canary-outside.txt` }, 'deny');
  expect('probe guard write', 'guard-canary', 'Write', { file_path: '.fullstack-builder/guard/canary.txt' }, 'deny');
  expect('probe git push', 'guard-canary', 'Bash', { command: 'git push' }, 'deny');
  expect('probe permitted write', 'guard-canary', 'Write', { file_path: `${PROJECT}/docs/runs/${runName}/agents/canary-allowed.txt` }, 'allow');
  writeFileSync(join(runDir, 'agents', 'canary-allowed.txt'), 'ok');
  const report = run('node', [join(SKILL, 'scripts', 'guard-report.mjs'), '--canary'], root);
  results.push({ name: 'canary report passes', ok: report.status === 0, actual: report.stdout.trim(), verdict: 'CANARY OK' });
  expect('spawn blocked without a wave plan', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'first' }, 'deny');
  const planned = run('node', [join(SKILL, 'scripts', 'wave.mjs'), 'plan', '--agents', 'a2-designer'], root);
  results.push({ name: 'wave plan written', ok: planned.status === 0, actual: planned.stdout.trim(), verdict: 'plan ok' });
  expect('spawn allowed after canary', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'first' }, 'allow');
  expect('second spawn allowed', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'second' }, 'allow');
  expect('spawn over the limit blocked', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'third' }, 'deny');
}

function adapterCases() {
  const adapter = { tool_aliases: { run_shell: 'Bash' }, identity: { id: 'worker_id', type: 'worker_role' } };
  const out = normalizeInput({ tool_name: 'run_shell', worker_id: 'w1', worker_role: 'a4-backend' }, adapter);
  check('adapter maps tool and identity', out.tool_name === 'Bash' && out.agent_id === 'w1' && out.agent_type === 'a4-backend', JSON.stringify(out));
  const plain = normalizeInput({ tool_name: 'Read', agent_id: 'x', agent_type: 'y' });
  check('adapter defaults pass through', plain.tool_name === 'Read' && plain.agent_type === 'y', JSON.stringify(plain));
}

function failClosedCases() {
  const guard = join(root, '.fullstack-builder', 'guard', 'guard.mjs');
  const garbage = run('node', [guard], root, 'not json').status;
  results.push({ name: 'invalid input blocks', ok: garbage === 2, actual: `exit ${garbage}`, verdict: 'deny' });
  const lonely = mkdtempSync(join(tmpdir(), 'guard-noconfig-'));
  mkdirSync(join(lonely, 'lib'));
  copyFileSync(join(SKILL, 'guard', 'guard.mjs'), join(lonely, 'guard.mjs'));
  ['scope', 'bash', 'state', 'bus', 'waves', 'adapter'].forEach((name) => copyFileSync(join(SKILL, 'guard', 'lib', `${name}.mjs`), join(lonely, 'lib', `${name}.mjs`)));
  const missing = run('node', [join(lonely, 'guard.mjs')], root, JSON.stringify({ tool_name: 'Read', tool_input: {} })).status;
  results.push({ name: 'missing config blocks', ok: missing === 2, actual: `exit ${missing}`, verdict: 'deny' });
  rmSync(lonely, { recursive: true, force: true });
}

const readFile = (...parts) => JSON.parse(readFileSync(join(root, ...parts), 'utf8'));
const runPath = () => join(root, PROJECT, 'docs', 'runs', runName);
const wave = (...args) => run('node', [join(SKILL, 'scripts', 'wave.mjs'), ...args], root);
const check = (name, ok, actual) => results.push({ name, ok, actual: String(actual).trim().slice(0, 160), verdict: 'as expected' });
const put = (rel, text = 'x') => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
};
const mail = (from, to, kind, seq = '001') => `${PROJECT}/docs/runs/${runName}/bus/outbox/${from}/${seq}-to-${to}-${kind}.md`;

function waveCases() {
  const planned = wave('plan', '--agents', 'a1-architect,a2-designer,a4-backend,a3-cart,a12-qa,a13-reviewer');
  const waves = readFile(PROJECT, 'docs', 'runs', runName, 'waves.json').waves;
  check('plan groups parallel agents', JSON.stringify(waves) === JSON.stringify([['a1-architect'], ['a2-designer', 'a4-backend'], ['a3-cart'], ['a12-qa', 'a13-reviewer']]), JSON.stringify(waves));
  check('plan reports counts', /planned agent calls/.test(planned.stdout), planned.stdout);
  expect('later wave blocked', 'pm', 'Agent', { subagent_type: 'a3-cart', description: 'x' }, 'deny');
  expect('wave 2 blocked before wave 1', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'x' }, 'deny');
  expect('unplanned agent blocked', 'pm', 'Agent', { subagent_type: 'a5-data', description: 'x' }, 'deny');
  expect('wave 1 spawn allowed', 'pm', 'Agent', { subagent_type: 'a1-architect', description: 'scaffold' }, 'allow');
  expect('wave 2 still blocked while wave 1 runs', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'x' }, 'deny');
  put(`${PROJECT}/vite.config.js`);
  const closed = wave('complete');
  check('wave 1 completes when clean', closed.status === 0 && /Next: wave 2/.test(closed.stdout), closed.stdout + closed.stderr);
  expect('parallel spawn one', 'pm', 'Agent', { subagent_type: 'a2-designer', description: 'theme' }, 'allow');
  expect('parallel spawn two', 'pm', 'Agent', { subagent_type: 'a4-backend', description: 'api' }, 'allow');
  expect('wave 3 blocked during wave 2', 'pm', 'Agent', { subagent_type: 'a3-cart', description: 'x' }, 'deny');
}

function busCases() {
  const body = { content: 'Which header shape does the cart API return?' };
  expect('posts a request to a peer', 'a2-designer', 'Write', { file_path: mail('a2-designer', 'a4-backend', 'request'), ...body }, 'allow');
  put(mail('a2-designer', 'a4-backend', 'request'), body.content);
  expect('peer blocked until it reads: write', 'a4-backend', 'Write', { file_path: `${PROJECT}/src/api/x.js`, content: 'x' }, 'deny');
  expect('peer blocked until it reads: shell', 'a4-backend', 'Bash', { command: `npm --prefix ${PROJECT} run lint` }, 'deny');
  expect('sender is not blocked by its own mail', 'a2-designer', 'Write', { file_path: `${PROJECT}/src/theme/t.js`, content: 'x' }, 'allow');
  expect('peer may read the message', 'a4-backend', 'Read', { file_path: join(runPath(), 'bus', 'outbox', 'a2-designer', '001-to-a4-backend-request.md') }, 'allow');
  expect('peer can work after reading', 'a4-backend', 'Write', { file_path: `${PROJECT}/src/api/x.js`, content: 'x' }, 'allow');
  expect('peer replies', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'a2-designer', 'reply'), content: 'Returns {lines}.' }, 'allow');
  put(mail('a4-backend', 'a2-designer', 'reply'), 'Returns {lines}.');
  expect('cannot forge another sender', 'a4-backend', 'Write', { file_path: mail('a2-designer', 'pm', 'info', '002'), content: 'x' }, 'deny');
  expect('cannot post a badly named file', 'a4-backend', 'Write', { file_path: `${PROJECT}/docs/runs/${runName}/bus/outbox/a4-backend/note.md`, content: 'x' }, 'deny');
  expect('cannot post to an unknown recipient', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'bob', 'info', '002'), content: 'x' }, 'deny');
  expect('cannot post to itself', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'a4-backend', 'info', '002'), content: 'x' }, 'deny');
  expect('cannot overwrite a message', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'a2-designer', 'reply'), content: 'changed' }, 'deny');
  expect('cannot edit a message', 'a4-backend', 'Edit', { file_path: mail('a4-backend', 'a2-designer', 'reply') }, 'deny');
  expect('cannot post an oversize message', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'pm', 'info', '002'), content: 'y'.repeat(4001) }, 'deny');
  expect('cannot post an empty message', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'pm', 'info', '003'), content: ' ' }, 'deny');
  expect('pm posts from its own outbox', 'pm', 'Write', { file_path: mail('pm', 'a4-backend', 'decision'), content: 'Use {lines}.' }, 'allow');
  expect('pm cannot forge an agent', 'pm', 'Write', { file_path: mail('a4-backend', 'pm', 'info', '009'), content: 'x' }, 'deny');
  expect('agent cannot forge pm', 'a4-backend', 'Write', { file_path: mail('pm', 'a2-designer', 'info', '009'), content: 'x' }, 'deny');
  expect('broadcast accepted', 'a4-backend', 'Write', { file_path: mail('a4-backend', 'all', 'decision', '004'), content: 'Cart lines are {productId, qty}.' }, 'allow');
  put(mail('a4-backend', 'all', 'decision', '004'), 'Cart lines are {productId, qty}.');
  put(mail('pm', 'a4-backend', 'decision'), 'Use {lines}.');
  put(mail('a4-backend', 'a2-designer', 'reply'), 'Returns {lines}.');
}

function waveFinishCases() {
  expect('broadcast blocks a reader-to-be', 'a2-designer', 'Bash', { command: 'git status' }, 'deny');
  const early = wave('complete');
  check('completion refused with unread mail', early.status === 1 && /unread/.test(early.stderr), early.stderr);
  ['a2-designer/001-to-a4-backend-request.md', 'a4-backend/001-to-a2-designer-reply.md', 'a4-backend/004-to-all-decision.md'].forEach((rel) => {
    expect('reads ' + rel, 'a2-designer', 'Read', { file_path: join(runPath(), 'bus', 'outbox', rel) }, 'allow');
  });
  ['pm/001-to-a4-backend-decision.md', 'a2-designer/001-to-a4-backend-request.md', 'a4-backend/004-to-all-decision.md'].forEach((rel) => {
    expect('a4 reads ' + rel, 'a4-backend', 'Read', { file_path: join(runPath(), 'bus', 'outbox', rel) }, 'allow');
  });
  put(`${PROJECT}/src/theme/t.js`);
  put(`${PROJECT}/src/api/x.js`);
  put(`${PROJECT}/src/features/stray.js`);
  const dirty = wave('complete', '--revert');
  check('stray file fails the audit and is reverted', dirty.status === 1 && /VIOLATION/.test(dirty.stdout), dirty.stdout + dirty.stderr);
  const clean = wave('complete');
  check('wave 2 completes after cleanup', clean.status === 0 && /Next: wave 3/.test(clean.stdout), clean.stdout + clean.stderr);
  expect('wave 3 now allowed', 'pm', 'Agent', { subagent_type: 'a3-cart', description: 'cart' }, 'allow');
  expect('retry of an earlier agent reopens its wave', 'pm', 'Agent', { subagent_type: 'a4-backend', description: 'retry' }, 'allow');
  const report = run('node', [join(SKILL, 'scripts', 'bus-report.mjs')], root);
  check('bus report lists traffic', report.status === 0 && /Messages: 4/.test(report.stdout), report.stdout + report.stderr);
  const status = wave('status');
  check('status shows the open wave', /> Wave 2/.test(status.stdout), status.stdout);
}

function busAndWaveFlow() {
  root = mkdtempSync(join(tmpdir(), 'guard-selftest-bus-'));
  roots.push(root);
  setUp(25);
  writeFileSync(join(runPath(), 'canary.ok'), '{}');
  waveCases();
  busCases();
  waveFinishCases();
}

try {
  setUp();
  projectAndPathCases();
  commandAndSpawnCases();
  canaryFlow();
  failClosedCases();
  adapterCases();
  busAndWaveFlow();
} finally {
  roots.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
}

results.forEach((r) => process.stdout.write(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  (expected ${r.verdict}, got ${r.actual})`}\n`));
const failed = results.filter((r) => !r.ok).length;
process.stdout.write(`${failed ? 'SELFTEST FAILED' : 'SELFTEST OK'}: ${results.length - failed} of ${results.length} checks passed\n`);
process.exit(failed ? 1 : 0);
