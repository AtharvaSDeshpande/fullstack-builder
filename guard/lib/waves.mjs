/** Wave plan and state: which agents may run now. Shared by the guard hook and scripts/wave.mjs. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const planFile = (runDir) => join(runDir, 'waves.json');
const stateFile = (runDir) => join(runDir, 'wave-state.json');
const key = (index, type) => `${index}:${type}`;

export const loadPlan = (runDir) => (existsSync(planFile(runDir)) ? JSON.parse(readFileSync(planFile(runDir), 'utf8')) : null);
export const loadState = (runDir) => (existsSync(stateFile(runDir)) ? JSON.parse(readFileSync(stateFile(runDir), 'utf8')) : { started: {}, done: {} });
export const saveState = (runDir, state) => writeFileSync(stateFile(runDir), `${JSON.stringify(state, null, 2)}\n`);
export const savePlan = (runDir, plan) => writeFileSync(planFile(runDir), `${JSON.stringify(plan, null, 2)}\n`);

/** Index of the first wave that still has unfinished agents, or -1 when every wave is done. */
export const currentWave = (plan, state) => plan.waves.findIndex((wave, index) => wave.some((type) => !state.done[key(index, type)]));

export const inFlight = (state) => Object.keys(state.started).filter((k) => !state.done[k]);

/** Decides whether `type` may be spawned now. A retry of an earlier wave's agent reopens that wave. */
export function evaluateSpawn(plan, state, type) {
  const current = currentWave(plan, state);
  if (current >= 0 && plan.waves[current].includes(type)) return { allow: true, key: key(current, type) };
  const limit = current >= 0 ? current : plan.waves.length;
  for (let index = limit - 1; index >= 0; index -= 1) {
    if (plan.waves[index].includes(type)) return { allow: true, key: key(index, type), reopen: true };
  }
  const planned = plan.waves.findIndex((wave) => wave.includes(type));
  if (planned < 0) return { allow: false, reason: `"${type}" is not in this run's wave plan` };
  const waiting = current >= 0 ? plan.waves[current].filter((t) => !state.done[key(current, t)]).join(', ') : '';
  return { allow: false, reason: `"${type}" belongs to wave ${planned + 1}, but wave ${current + 1} is still open (waiting on: ${waiting}). Finish it with wave.mjs complete` };
}

export function applySpawn(state, decision) {
  if (decision.reopen) delete state.done[decision.key];
  state.started[decision.key] = new Date().toISOString();
}

export function completeInFlight(state) {
  const keys = inFlight(state);
  keys.forEach((k) => { state.done[k] = new Date().toISOString(); });
  return keys.map((k) => k.slice(k.indexOf(':') + 1));
}
