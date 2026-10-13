# AGENTS.md

Instructions for coding agents working **on this repository**. (For the rules this repository
ships to *other* projects, read `skills/prevent-ai-slop/assets/agents-gate-snippet.md`.)

## What this repository is

A bundle of coding-agent skills that prevent, measure and remove generic AI-template patterns in
web UIs. It contains three skills under `skills/`, plus the validator that enforces the skill
standard.

## Layout

```text
skills/
  prevent-ai-slop/   design-time rules and checklist (entry point)
  slopcheck-audit/   measurement CLI that runs the original checker engine
  slop-fix/          remediation playbook for audit findings
scripts/
  validate-skills.mjs   the standard's enforcement, run in CI
tests/
  test-repo.mjs         tests for the validator itself
```

## Definition of done

1. `npm run validate` passes with zero errors.
2. `npm run test:unit` passes.
3. `npm run test:browser` passes when Playwright and Chromium are installed.
4. New behaviour is documented in the relevant `SKILL.md` or `references/` file, not only in a
   commit message.
5. `README.md` still describes the repository accurately.

## Conventions

- One directory per skill. `SKILL.md` carries YAML frontmatter with `name` (kebab-case, equal to
  the directory name), `description` (third person, states what it does and when to use it) and
  `license`. Keep the body under 500 lines and push detail into `references/`.
- Reference bundled files with relative paths from the skill directory. Never use absolute paths,
  and never reference another skill by relative path — a skill must work when installed alone.
- Skill names are globally unique identifiers. Do not rename an existing skill without a note in
  `CHANGELOG.md`; agents and users pin them.
- Keep each `agents/openai.yaml` in sync with its skill's purpose.

## Hard rules

- **Do not copy the third-party engine.** `slopcheck-audit` fetches the live checker's exported
  functions at run time. Bundling or vendoring that code is not allowed.
- **Never break the fail-closed guarantees.** Loss of the original engine stays exit code 1; a
  strict parity mismatch stays exit code 3; `--mode legacy` stays opt-in and labelled approximate.
- **Never claim parity from fixtures.** Test fixtures are marked `CONTRACT TEST ONLY` and prove
  wiring, not the live site.
- **Never present the score as an AI-authorship probability** in documentation, code comments or
  report text.
- Do not add dependencies to the shipped skills. They run in the user's project with the user's
  Node and Playwright; this repository's `devDependencies` exist for its own tests only.

## When changing the audit engine contract

If the live site changes its public API, update
`skills/slopcheck-audit/scripts/canonical-runner.mjs` and the contract fixtures together, then
note it in `CHANGELOG.md`. Do not reintroduce a local reimplementation of the rules as a silent
fallback.
