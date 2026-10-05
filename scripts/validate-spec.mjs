#!/usr/bin/env node
/**
 * Validates a site spec (JSON). Errors stop a run; warnings are logged.
 * Usage: node scripts/validate-spec.mjs <spec.json>
 */
import { readFileSync } from 'node:fs';

const BACKEND_MODES = ['mock', 'real', 'none'];
const PRIORITIES = ['must', 'should', 'could'];
const MIN_ACCEPTANCE = 3;
const MIN_ACCEPTANCE_LENGTH = 10;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PLACEHOLDER_PATTERN = /^<.*>$/;
const DECISION_SOURCES = ['client', 'document', 'pm-default'];

const BLANK_TEMPLATE_PLACEHOLDERS = 5;
const errors = [];
const warnings = [];
const addError = (path, message) => errors.push(`${path}: ${message}`);
const addWarning = (path, message) => warnings.push(`${path}: ${message}`);

const getPath = (spec, path) => path.split('.').reduce((node, key) => node?.[key], spec);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;

function requireText(spec, path) {
  if (!isText(getPath(spec, path))) addError(path, 'required, must be a non-empty string');
}

function requireList(spec, path, minimum = 1) {
  const value = getPath(spec, path);
  if (!Array.isArray(value) || value.length < minimum) {
    addError(path, `required, must be a list with at least ${minimum} item(s)`);
    return [];
  }
  return value;
}

function findPlaceholders(node, path) {
  if (typeof node === 'string' && PLACEHOLDER_PATTERN.test(node.trim())) {
    addError(path, `unfilled placeholder ${node}`);
  } else if (Array.isArray(node)) {
    node.forEach((item, index) => findPlaceholders(item, `${path}[${index}]`));
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => findPlaceholders(value, `${path}.${key}`));
  }
}

function checkUniqueIds(items, path) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isText(item?.id)) return addError(`${path}[${index}].id`, 'required, must be a non-empty string');
    if (seen.has(item.id)) addError(`${path}[${index}].id`, `duplicate id "${item.id}"`);
    seen.add(item.id);
  });
  return seen;
}

function checkFeatures(features) {
  checkUniqueIds(features, 'features');
  features.forEach((feature, index) => {
    if (!isText(feature.name)) addError(`features[${index}].name`, 'required');
    if (isText(feature.id) && !SLUG_PATTERN.test(feature.id)) {
      addError(`features[${index}].id`, 'must be kebab-case (it becomes an agent name and a folder)');
    }
    if (!PRIORITIES.includes(feature.priority)) {
      addError(`features[${index}].priority`, `must be one of ${PRIORITIES.join(', ')}`);
    }
  });
  if (!features.some((feature) => feature.priority === 'must')) {
    addWarning('features', 'no feature has priority "must"');
  }
}

function checkScreens(screens) {
  checkUniqueIds(screens, 'screens');
  screens.forEach((screen, index) => {
    if (!isText(screen.name)) addError(`screens[${index}].name`, 'required');
    if (!isText(screen.route) || !screen.route.startsWith('/')) {
      addError(`screens[${index}].route`, 'required, must start with "/"');
    }
  });
}

function checkCrossReferences(features, screens) {
  const featureIds = new Set(features.map((feature) => feature.id));
  const screenIds = new Set(screens.map((screen) => screen.id));
  features.forEach((feature) => (feature.screens ?? []).forEach((id) => {
    if (!screenIds.has(id)) addError(`features[${feature.id}].screens`, `unknown screen "${id}"`);
  }));
  screens.forEach((screen) => (screen.features ?? []).forEach((id) => {
    if (!featureIds.has(id)) addError(`screens[${screen.id}].features`, `unknown feature "${id}"`);
  }));
}

function checkLanguages(spec) {
  const supported = requireList(spec, 'languages.supported');
  const defaultLanguage = getPath(spec, 'languages.default');
  requireText(spec, 'languages.default');
  if (supported.length && isText(defaultLanguage) && !supported.includes(defaultLanguage)) {
    addError('languages.supported', `must include the default language "${defaultLanguage}"`);
  }
}

function checkStack(spec) {
  requireText(spec, 'stack.frontend.framework');
  const mode = getPath(spec, 'stack.backend.mode');
  if (!BACKEND_MODES.includes(mode)) {
    addError('stack.backend.mode', `required, must be one of ${BACKEND_MODES.join(', ')}`);
  }
  if (mode === 'real' && !isText(getPath(spec, 'stack.database.engine'))) {
    addError('stack.database.engine', 'required when stack.backend.mode is "real"');
  }
}

function checkAcceptance(spec) {
  const items = requireList(spec, 'acceptance', MIN_ACCEPTANCE);
  items.forEach((item, index) => {
    if (!isText(item) || item.trim().length < MIN_ACCEPTANCE_LENGTH) {
      addError(`acceptance[${index}]`, 'must be a testable sentence');
    }
  });
}

function checkConstraints(spec) {
  ['forbidden_packages', 'libraries_forbidden'].forEach((key) => {
    const list = getPath(spec, `constraints.${key}`);
    if (list !== undefined && !(Array.isArray(list) && list.every(isText))) {
      addError(`constraints.${key}`, 'must be a list of package names');
    }
  });
  const limit = getPath(spec, 'constraints.max_agent_calls');
  if (limit !== undefined && !(Number.isInteger(limit) && limit > 0)) {
    addError('constraints.max_agent_calls', 'must be a positive whole number');
  }
}

function asList(spec, path) {
  const value = getPath(spec, path);
  return Array.isArray(value) ? value : [];
}

function checkPersonasAndJourneys(spec, featureIds) {
  const personaIds = checkUniqueIds(asList(spec, 'audience.personas'), 'audience.personas');
  const journeys = asList(spec, 'journeys');
  checkUniqueIds(journeys, 'journeys');
  journeys.forEach((journey, index) => {
    if (journey.persona && !personaIds.has(journey.persona)) addError(`journeys[${index}].persona`, `unknown persona "${journey.persona}"`);
    (journey.features ?? []).forEach((id) => {
      if (!featureIds.has(id)) addError(`journeys[${index}].features`, `unknown feature "${id}"`);
    });
    if (!Array.isArray(journey.steps) || journey.steps.length === 0) addError(`journeys[${index}].steps`, 'must list at least one step');
    if (!isText(journey.success)) addWarning(`journeys[${index}].success`, 'no success condition, QA cannot test this journey');
  });
}

function checkBusiness(spec) {
  asList(spec, 'business.success_metrics').forEach((item, index) => {
    if (!isText(item.metric)) addError(`business.success_metrics[${index}].metric`, 'required');
    if (!isText(item.target)) addWarning(`business.success_metrics[${index}].target`, 'no target; write "set after baseline" if unknown');
  });
  asList(spec, 'timeline.milestones').forEach((item, index) => {
    if (!isText(item.name)) addError(`timeline.milestones[${index}].name`, 'required');
  });
}

function checkDecisionsAndRisks(spec) {
  asList(spec, 'decisions').forEach((item, index) => {
    if (!DECISION_SOURCES.includes(item.source)) addError(`decisions[${index}].source`, `must be one of ${DECISION_SOURCES.join(', ')}`);
  });
  asList(spec, 'assumptions').forEach((item) => {
    if (item.confirmed_by_client !== true) addWarning('assumptions', `not confirmed by the client: ${item.statement}`);
  });
  asList(spec, 'open_questions').forEach((item) => addWarning('open_questions', `unresolved (${item.owner ?? 'no owner'}): ${item.question}`));
}

function checkCompliance(spec) {
  if (getPath(spec, 'compliance.pii') === true && !isText(getPath(spec, 'compliance.retention'))) {
    addWarning('compliance.retention', 'PII is collected but no retention rule is stated');
  }
  if (getPath(spec, 'payments.needed') === true && getPath(spec, 'payments.mocked') !== true && !isText(getPath(spec, 'payments.provider'))) {
    addWarning('payments.provider', 'real payments need a provider');
  }
}

function checkExtended(spec, features) {
  checkPersonasAndJourneys(spec, new Set(features.map((feature) => feature.id)));
  checkBusiness(spec);
  checkDecisionsAndRisks(spec);
  checkCompliance(spec);
}

function validate(spec) {
  findPlaceholders(spec, 'spec');
  ['project.name', 'project.slug', 'project.summary', 'audience.primary_users'].forEach((path) => requireText(spec, path));
  if (isText(getPath(spec, 'project.slug')) && !SLUG_PATTERN.test(spec.project.slug)) {
    addError('project.slug', 'must be kebab-case (lowercase letters, digits, hyphens)');
  }
  checkLanguages(spec);
  checkStack(spec);
  const features = requireList(spec, 'features');
  const screens = requireList(spec, 'screens');
  checkFeatures(features);
  checkScreens(screens);
  checkCrossReferences(features, screens);
  checkAcceptance(spec);
  checkConstraints(spec);
  checkExtended(spec, features);
  (spec.unknowns ?? []).forEach((item) => addWarning('unknowns', `do not assume: ${item}`));
}

function main() {
  const file = process.argv[2];
  if (!file) {
    process.stderr.write('Usage: node validate-spec.mjs <spec.json>\n');
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    process.stdout.write(`ERROR ${file}: cannot read or parse JSON (${error.message})\n`);
    process.exit(1);
  }
  validate(spec);
  warnings.forEach((line) => process.stdout.write(`WARN  ${line}\n`));
  errors.forEach((line) => process.stdout.write(`ERROR ${line}\n`));
  process.stdout.write(errors.length ? `FAILED: ${errors.length} error(s), ${warnings.length} warning(s)\n` : `OK: spec valid, ${warnings.length} warning(s)\n`);
  const placeholders = errors.filter((line) => line.includes('unfilled placeholder')).length;
  if (placeholders >= BLANK_TEMPLATE_PLACEHOLDERS) {
    process.stdout.write(`NOTE: ${placeholders} fields still hold <placeholders>, so this looks like a blank template. Fill it in (see examples/site.spec.json for a complete spec) or run the bootstrap interview.\n`);
  }
  process.exit(errors.length ? 1 : 0);
}

main();
