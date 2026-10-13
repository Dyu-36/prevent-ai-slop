# Contributing

Thanks for improving the bundle. Keep changes small, documented and validated.

## Setup

```bash
git clone https://github.com/Dyu-36/prevent-ai-slop.git
cd prevent-ai-slop
npm install
npx playwright install chromium   # only needed for the browser contract tests
npm test                          # validate + unit tests
```

## Before opening a pull request

1. `npm run validate` — zero errors. Warnings should be justified in the PR description.
2. `npm run test:unit` — must pass.
3. `npm run test:browser` — must pass when Chromium is available.
4. Update the affected `SKILL.md` or `references/` file. A behaviour change that exists only in
   the diff is not documented.
5. Add a `CHANGELOG.md` entry under `## [Unreleased]`.

## Writing a skill

- Directory name = frontmatter `name`, kebab-case, ≤ 64 characters, globally unique.
- Frontmatter is limited to `name`, `description`, `license`, and optionally `allowed-tools` or
  `metadata`.
- `description` is third person, ≤ 1024 characters, and answers both "what does this do" and
  "when should an agent load it". Include the words a user would actually type.
- Keep the body under 500 lines. Push depth into `references/`, executables into `scripts/`, and
  copy-paste artefacts into `assets/`.
- Reference bundled files with relative paths from the skill directory. A skill must work when
  installed alone: no `../other-skill/...` references and no absolute paths.
- Add `agents/openai.yaml` with `display_name` and a `short_description` under ~72 characters.

## Rules that must not regress

- The audit never silently substitutes approximate heuristics for the original engine.
- `--mode legacy` stays opt-in and labelled approximate everywhere it surfaces.
- Fixture-based runs stay marked `CONTRACT TEST ONLY` and are never called live parity.
- The score is never described as the probability that AI wrote the page.
- The third-party rule engine is not vendored into this repository.

## Reporting bugs

Include the command, the mode, the `capture` block from the JSON report (with private URLs
redacted), the expected and actual behaviour, and the Node and Playwright versions. For parity
questions, attach the `comparison` block.
