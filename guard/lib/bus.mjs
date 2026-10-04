/** Message bus between agents. Messages are write-once files in docs/runs/<run>/bus/outbox/<sender>/. */
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const BROADCAST = 'all';
export const PM = 'pm';
export const MAX_MESSAGE_CHARS = 4000;
export const NAME_FORMAT = 'NNN-to-<agent-type|pm|all>-<info|request|reply|blocker|decision>.md';
const NAME = /^(\d{3})-to-([a-z0-9][a-z0-9-]*)-(info|request|reply|blocker|decision)\.md$/;

export const parseMessageName = (name) => {
  const match = NAME.exec(name);
  return match ? { seq: match[1], to: match[2], kind: match[3] } : null;
};
export const outboxDir = (runDir) => join(runDir, 'bus', 'outbox');
const receiptsFile = (runDir, agent) => join(runDir, 'bus', 'receipts', `${agent}.txt`);

export function listMessages(runDir) {
  const root = outboxDir(runDir);
  if (!existsSync(root)) return [];
  const messages = [];
  for (const from of readdirSync(root)) {
    const dir = join(root, from);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      const parsed = parseMessageName(file);
      if (parsed) messages.push({ ...parsed, from, file, key: `${from}/${file}`, path: join(dir, file), mtimeMs: statSync(join(dir, file)).mtimeMs });
    }
  }
  return messages.sort((a, b) => a.mtimeMs - b.mtimeMs || a.key.localeCompare(b.key));
}

export function readReceipts(runDir, agent) {
  const file = receiptsFile(runDir, agent);
  return new Set(existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []);
}

export function markRead(runDir, agent, key) {
  mkdirSync(join(runDir, 'bus', 'receipts'), { recursive: true });
  appendFileSync(receiptsFile(runDir, agent), `${key}\n`);
}

export function unreadFor(runDir, agent) {
  const seen = readReceipts(runDir, agent);
  return listMessages(runDir).filter((m) => (m.to === agent || m.to === BROADCAST) && m.from !== agent && !seen.has(m.key));
}

/** Returns a reason string when the write is not a valid new message, otherwise null. */
export function busWriteProblem({ tool, abs, content, sender, recipients, runDir }) {
  const parts = abs.slice(outboxDir(runDir).length + 1).split('/');
  if (tool !== 'Write') return 'messages are created once with Write and cannot be edited';
  if (parts.length !== 2) return 'a message must sit directly inside your own outbox folder';
  if (parts[0] !== sender) return `you can only post from your own outbox (bus/outbox/${sender}/)`;
  const parsed = parseMessageName(parts[1]);
  if (!parsed) return `message file names look like ${NAME_FORMAT}`;
  if (parsed.to === sender || !recipients.includes(parsed.to)) return `unknown recipient "${parsed.to}". Use one of: ${recipients.join(', ')}`;
  if (typeof content !== 'string' || content.trim() === '' || content.length > MAX_MESSAGE_CHARS) return `a message must have 1 to ${MAX_MESSAGE_CHARS} characters`;
  if (existsSync(abs)) return 'a message cannot be overwritten; post a new one with the next number';
  return null;
}
