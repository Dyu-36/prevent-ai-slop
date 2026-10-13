#!/usr/bin/env node
/**
 * Validate this bundle against the coding-agent skill standard.
 *
 * Checks, per skill directory under skills/:
 *   - SKILL.md exists and opens with a closed YAML frontmatter block
 *   - required `name` and `description` fields, allowed keys only
 *   - name is kebab-case, <= 64 chars, and matches the directory name
 *   - description is third-person, <= 1024 chars, free of placeholders
 *   - body stays within the progressive-disclosure budget (<= 500 lines)
 *   - every `references/...`, `scripts/...`, `assets/...`, `agents/...`, `tests/...`
 *     path referenced by SKILL.md resolves inside the skill
 *   - agents/openai.yaml, when present, declares display_name and short_description
 *   - every bundled .mjs file parses (node --check)
 *
 * Usage: node scripts/validate-skills.mjs [--root DIR] [--skills DIR] [--quiet]
 */
import {readFile, readdir, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_KEYS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
const REQUIRED_ROOT_FILES = ['README.md', 'LICENSE', 'AGENTS.md', 'package.json'];
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_BODY_LINES = 500;
const FIRST_PERSON = /\b(?:I|I'm|I'll|I've|my)\b|you can use|you should use/i;

const errors = [];
const warnings = [];
const notes = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);

function parseArgs(argv) {
  const args = {root: REPO_ROOT, skills: null, quiet: false};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--quiet') args.quiet = true;
    else if (a === '--root') args.root = resolve(argv[++i]);
    else if (a === '--skills') args.skills = resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/validate-skills.mjs [--root DIR] [--skills DIR] [--quiet]');
      process.exit(0);
    } else throw new Error(`Unknown argument: ${a}`);
  }
  args.skills = args.skills ?? join(args.root, 'skills');
  return args;
}

/** Minimal frontmatter reader: `key: value`, quoted values, and folded block scalars. */
function readFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== '---') return {error: 'must start with a --- frontmatter block'};
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end === -1) return {error: 'frontmatter block is never closed with ---'};
  const fields = {};
  let key = null;
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (match) {
      key = match[1];
      const raw = match[2].trim();
      fields[key] = /^[>|]-?$/.test(raw) ? '' : raw.replace(/^(['"])(.*)\1$/s, '$2');
      continue;
    }
    if (/^\s+\S/.test(line) && key) {
      fields[key] = `${fields[key]} ${line.trim()}`.trim();
      continue;
    }
    return {error: `unsupported frontmatter syntax on line ${i + 1}: ${line.trim()}`};
  }
  return {fields, body: lines.slice(end + 1)};
}

function findReferences(body) {
  const withoutFences = body.replace(/```[\s\S]*?```/g, '');
  const found = new Set();
  const pattern = /`((?:references|scripts|assets|agents|tests)\/[A-Za-z0-9._/-]*)`|\[[^\]]*\]\(((?:references|scripts|assets|agents|tests)\/[A-Za-z0-9._/-]+)\)/g;
  let match;
  while ((match = pattern.exec(withoutFences))) {
    const target = (match[1] ?? match[2]).replace(/[.,;:]+$/, '');
    if (target) found.add(target);
  }
  return [...found];
}

function checkScriptSyntax(file) {
  try {
    execFileSync(process.execPath, ['--check', file], {stdio: 'pipe'});
  } catch (error) {
    const detail = (error.stderr?.toString() ?? error.message).trim().split('\n').slice(0, 2).join(' ');
    fail(file, `does not parse: ${detail}`);
  }
}

async function listFiles(dir, filter, out = []) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await listFiles(full, filter, out);
    else if (filter(full)) out.push(full);
  }
  return out;
}

async function validateSkill(skillDir, name) {
  const label = `skills/${name}`;
  const skillFile = join(skillDir, 'SKILL.md');
  if (!existsSync(skillFile)) {
    fail(label, 'SKILL.md is missing');
    return;
  }
  const text = await readFile(skillFile, 'utf8');
  const parsed = readFrontmatter(text);
  if (parsed.error) {
    fail(`${label}/SKILL.md`, parsed.error);
    return;
  }
  const {fields, body} = parsed;

  for (const key of Object.keys(fields)) {
    if (!ALLOWED_KEYS.has(key)) warn(`${label}/SKILL.md`, `unknown frontmatter key "${key}"`);
  }
  const skillName = fields.name ?? '';
  if (!skillName) fail(`${label}/SKILL.md`, 'frontmatter is missing "name"');
  else {
    if (!NAME_PATTERN.test(skillName)) fail(`${label}/SKILL.md`, `name "${skillName}" is not kebab-case`);
    if (skillName.length > MAX_NAME) fail(`${label}/SKILL.md`, `name exceeds ${MAX_NAME} characters`);
    if (skillName !== name) fail(`${label}/SKILL.md`, `name "${skillName}" must match its directory name "${name}"`);
  }
  const description = fields.description ?? '';
  if (!description) fail(`${label}/SKILL.md`, 'frontmatter is missing "description"');
  else {
    if (description.length > MAX_DESCRIPTION)
      fail(`${label}/SKILL.md`, `description is ${description.length} characters (limit ${MAX_DESCRIPTION})`);
    if (description.length < 40)
      warn(`${label}/SKILL.md`, 'description is very short; state what it does and when to use it');
    if (!/\b(use when|use for|use on|use after|use before|use if)\b/i.test(description))
      warn(`${label}/SKILL.md`, 'description should say when the skill applies ("Use when ...")');
    if (FIRST_PERSON.test(description))
      warn(`${label}/SKILL.md`, 'description should be third person, not "I"/"you can"');
    if (/\b(?:TODO|FIXME|TBD|lorem ipsum)\b/i.test(description))
      fail(`${label}/SKILL.md`, 'description still contains a placeholder');
  }
  if (body.join('\n').trim().length === 0) fail(`${label}/SKILL.md`, 'body is empty');
  const bodyLineCount = body.length;
  if (bodyLineCount > MAX_BODY_LINES)
    fail(`${label}/SKILL.md`, `body is ${bodyLineCount} lines; move detail into references/ (limit ${MAX_BODY_LINES})`);

  for (const reference of findReferences(body.join('\n'))) {
    const target = join(skillDir, reference);
    if (!existsSync(target)) fail(`${label}/SKILL.md`, `referenced path does not exist: ${reference}`);
  }

  const agentFile = join(skillDir, 'agents', 'openai.yaml');
  if (existsSync(agentFile)) {
    const agentText = await readFile(agentFile, 'utf8');
    for (const key of ['display_name', 'short_description']) {
      if (!new RegExp(`^\\s*${key}:`, 'm').test(agentText)) fail(`${label}/agents/openai.yaml`, `missing ${key}`);
    }
    const short = /short_description:\s*"?([^"\n]+)"?/.exec(agentText)?.[1]?.trim() ?? '';
    if (short.length > 72) warn(`${label}/agents/openai.yaml`, `short_description is ${short.length} characters`);
  } else {
    warn(label, 'no agents/openai.yaml (optional, but expected in this bundle)');
  }

  for (const file of await listFiles(skillDir, (f) => f.endsWith('.mjs'))) checkScriptSyntax(file);
  notes.push(`${label}: ${bodyLineCount} body lines, ${description.length}-char description`);
}

async function validateRoot(root) {
  for (const file of REQUIRED_ROOT_FILES) {
    if (!existsSync(join(root, file))) fail(file, 'required repository file is missing');
  }
  const manifest = join(root, '.claude-plugin', 'marketplace.json');
  if (existsSync(manifest)) {
    try {
      const parsed = JSON.parse(await readFile(manifest, 'utf8'));
      if (!parsed.name) fail('.claude-plugin/marketplace.json', 'missing "name"');
      if (!Array.isArray(parsed.plugins) || parsed.plugins.length === 0)
        fail('.claude-plugin/marketplace.json', 'missing a non-empty "plugins" array');
    } catch (error) {
      fail('.claude-plugin/marketplace.json', `is not valid JSON: ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.skills)) throw new Error(`Skills directory not found: ${args.skills}`);
  await validateRoot(args.root);
  const entries = await readdir(args.skills, {withFileTypes: true});
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  if (dirs.length === 0) fail(relative(args.root, args.skills) || 'skills', 'contains no skill directories');
  const seen = new Set();
  for (const name of dirs) {
    if (seen.has(name)) fail(`skills/${name}`, 'duplicate skill directory name');
    seen.add(name);
    await validateSkill(join(args.skills, name), name);
  }

  if (!args.quiet) {
    for (const note of notes) console.log(`  ok  ${note}`);
  }
  for (const message of warnings) console.log(`warn  ${message}`);
  for (const message of errors) console.log(`FAIL  ${message}`);
  console.log(
    `\n${dirs.length} skill(s): ${errors.length} error(s), ${warnings.length} warning(s) — ` +
      (errors.length ? 'NOT COMPLIANT' : 'compliant with the skill standard')
  );
  process.exitCode = errors.length ? 1 : 0;
}

main().catch((error) => {
  console.error(`validate-skills failed: ${error.message}`);
  process.exitCode = 1;
});
