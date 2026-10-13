import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const validator = join(repoRoot, 'scripts', 'validate-skills.mjs');
const run = (args) => spawnSync(process.execPath, [validator, ...args], {encoding: 'utf8', cwd: repoRoot});

test('the bundle complies with the skill standard', () => {
  const result = run(['--quiet']);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /compliant with the skill standard/);
});

test('every advertised skill is present', () => {
  const result = run([]);
  assert.equal(result.status, 0, result.stdout);
  for (const name of ['prevent-ai-slop', 'slopcheck-audit', 'slop-fix']) {
    assert.match(result.stdout, new RegExp(`skills/${name}`));
  }
});

test('the validator rejects a skill whose name does not match its directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skill-standard-'));
  const skillDir = join(root, 'skills', 'wrong-name');
  await mkdir(skillDir, {recursive: true});
  await writeFile(join(skillDir, 'SKILL.md'), '---\nname: other-name\ndescription: Use when testing.\n---\n\n# Body\n');

  const result = run(['--root', root]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /must match its directory name/);
});

test('the validator rejects a skill with no description and an unresolved reference', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skill-standard-'));
  const skillDir = join(root, 'skills', 'broken-skill');
  await mkdir(skillDir, {recursive: true});
  await writeFile(join(skillDir, 'SKILL.md'), '---\nname: broken-skill\n---\n\nSee `references/missing.md`.\n');

  const result = run(['--root', root]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /missing "description"/);
  assert.match(result.stdout, /referenced path does not exist: references\/missing\.md/);
});

test('the validator rejects a SKILL.md without frontmatter', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skill-standard-'));
  const skillDir = join(root, 'skills', 'no-frontmatter');
  await mkdir(skillDir, {recursive: true});
  await writeFile(join(skillDir, 'SKILL.md'), '# No frontmatter here\n');

  const result = run(['--root', root]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /must start with a --- frontmatter block/);
});
