# Prevent AI Slop

[![CI](https://github.com/Dyu-36/prevent-ai-slop/actions/workflows/ci.yml/badge.svg)](https://github.com/Dyu-36/prevent-ai-slop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Skill standard](https://img.shields.io/badge/skill%20standard-compliant-brightgreen.svg)](#standard-compliance)

A bundle of three coding-agent skills that keep generic AI-template output ("AI slop") out of a
web UI, measure what is left with the same engine as the live
[AI Slop Checker](https://ai-slop-checker.vercel.app/), and remove the findings without degrading
the product.

Built for agents that ship frontends: React, Next.js, Vite, Vue, Svelte, Astro or plain HTML.

## The skills

| Skill | Use it when | Delivers |
|---|---|---|
| [`prevent-ai-slop`](skills/prevent-ai-slop/SKILL.md) | starting, redesigning or reviewing a UI | design-time checklist, copy and layout rules, a copy-paste `AGENTS.md` gate |
| [`slopcheck-audit`](skills/slopcheck-audit/SKILL.md) | a measured score with per-rule evidence is needed | JSON, Markdown and screenshot reports; official / canonical / legacy modes |
| [`slop-fix`](skills/slop-fix/SKILL.md) | an audit report exists and the page must change | defect-vs-decision triage, per-pattern rewrites, bounded fix loop |

`prevent-ai-slop` is the entry point: it links to the other two, and each skill also works on its
own.

## Quick start

```bash
git clone https://github.com/Dyu-36/prevent-ai-slop.git
cp -r prevent-ai-slop/skills/* <your-project>/.agents/skills/

cd <your-project>
npm install -D playwright && npx playwright install chromium

# Audit the running dev app with the original engine on locally captured input
node .agents/skills/slopcheck-audit/scripts/slop-audit.mjs \
  --url http://localhost:3000 --mode canonical --wait-ms 3000 \
  --out .audit/slopcheck

# Audit a public deployment: the exact percentage the original site displays
node .agents/skills/slopcheck-audit/scripts/slop-audit.mjs \
  --url https://example.com --mode official --out .audit/official
```

Then read `.audit/slopcheck.json`, `.audit/slopcheck.md` and `.audit/slopcheck.png`. Exit codes:
`0` success, `1` original engine unavailable, `2` above `--max-score`, `3` parity mismatch.

## Install per agent

| Harness | Install |
|---|---|
| Claude Code (plugin marketplace) | `/plugin marketplace add Dyu-36/prevent-ai-slop` then `/plugin install prevent-ai-slop@prevent-ai-slop` |
| Codex, Cursor, Windsurf, DSH, other skill-aware agents | copy or symlink `skills/<name>/` into the agent's discovery directory (commonly `.agents/skills/<name>/` or `~/.claude/skills/<name>/`) |
| Any agent, no skill support | paste [`skills/prevent-ai-slop/assets/agents-gate-snippet.md`](skills/prevent-ai-slop/assets/agents-gate-snippet.md) into the project's `AGENTS.md` |
| Git submodule | `git submodule add https://github.com/Dyu-36/prevent-ai-slop .agents/skills/prevent-ai-slop` and keep the `skills/*` layout intact |

Keep each skill folder together: the scripts resolve their siblings relatively, and a skill must
work when installed on its own.

## What counts as slop

Not a claim about who wrote the code — a set of observable fingerprints:

- **Fingerprint** — default framework titles, generator meta tags, starter strings, unchosen
  vendor badges.
- **Copy** — "empower your workflow", unsourced statistics, invented testimonials, star ratings,
  placeholder names, emoji as bullets.
- **Layout** — gradient-clipped headlines, blurred colour orbs, icon-card grids as argument
  substitutes, stock photography, default component-library colours and fonts.
- **Visual** — purple/indigo→pink gradients, acid-lime accents, dark-plus-neon palettes used by
  default rather than by brand decision.
- **Nitpick** — uniform scroll-reveal animation, unrequested theme toggles, filler emoji and
  icons.

The full catalogue with before/after rewrites lives in
[`skills/prevent-ai-slop/references/anti-patterns.md`](skills/prevent-ai-slop/references/anti-patterns.md).

## Honest measurement

`slopcheck-audit` does not reimplement the checker's rules.

| Mode | Input | What the number is |
|---|---|---|
| `official` | public `https://` URL or screenshot | exactly the score the live checker displayed on that run |
| `canonical` | localhost, dev server, `--html`, `--image` | the original site's live `analyze()`/`score()`, applied to locally captured input |
| `legacy` | anything, opt-in only | a bundled approximation, explicitly labelled |

Identical scores for arbitrary local captures cannot be promised: the original site fetches public
URLs through Microlink/Jina, while `canonical` navigates locally, so the *inputs* can differ even
when the *rules* are identical. `--compare-official` checks the score **and** every rule signature
**and** every credit, and exits `3` on any mismatch. See
[`skills/slopcheck-audit/references/parity.md`](skills/slopcheck-audit/references/parity.md).

If the original engine cannot be fetched, the audit fails (exit `1`). It never silently falls back
to the approximation, and the score is never described as an AI-authorship probability.

## Repository layout

```text
skills/
  prevent-ai-slop/
    SKILL.md                        design-time rules and the build loop
    references/design-checklist.md  pre-flight checklist by measured category
    references/anti-patterns.md     catalogue with before/after rewrites
    assets/agents-gate-snippet.md   copy-paste project gate for AGENTS.md
  slopcheck-audit/
    SKILL.md                        modes, workflow, reporting rules
    references/                     api-reference, parity, rules, scoring-model, troubleshooting
    scripts/                        CLI, canonical runner, official runner, comparison, legacy
    tests/                          unit tests, browser contract tests and fixtures
  slop-fix/
    SKILL.md                        triage, fix order, bounded loop
    references/fix-playbook.md      per-pattern rewrites
    references/legitimate-exceptions.md  when to keep a detected pattern
scripts/validate-skills.mjs         enforces the skill standard
tests/test-repo.mjs                 tests for the validator
.claude-plugin/                     Claude Code plugin and marketplace manifests
```

## Standard compliance

The bundle follows the Agent Skills conventions and enforces them in CI:

- one directory per skill, with `SKILL.md` frontmatter limited to `name`, `description`, `license`
  (plus optional `allowed-tools` / `metadata`);
- `name` is kebab-case, ≤ 64 characters, and equals the directory name;
- `description` is third person, ≤ 1024 characters, and states **what** the skill does and **when**
  to use it;
- progressive disclosure: `SKILL.md` stays under 500 lines, with detail in `references/`,
  executables in `scripts/`, and copy-paste artefacts in `assets/`;
- relative paths only, and no cross-skill path references, so a skill installs standalone;
- `agents/openai.yaml` metadata per skill for harnesses that render it;
- `.claude-plugin/` manifests so the bundle installs as one plugin.

`npm run validate` checks all of the above and is part of `npm test` and CI.

## Testing

```bash
npm install
npm run validate        # skill standard
npm run test:unit       # scoring, comparison, URL guards, validator tests (no browser)
npm run test:browser    # Playwright contract tests against local fixtures
```

The browser tests drive mock fixtures marked `CONTRACT TEST ONLY`. They prove that the CLI wires
the original API correctly — not that the live site is reachable or unchanged.

## Safety and trust boundaries

- `official` mode hands the URL to the original site, which uses external extraction and model
  providers. Use it on public URLs only, and never with secrets, authenticated URLs, internal
  hostnames or unpublished user content.
- `canonical` mode downloads the checker page once, blocks that page's network requests, and
  evaluates locally captured markup and pixels inside the local browser. The downloaded code is
  still third-party JavaScript: audit only in an environment you trust. See
  [SECURITY.md](SECURITY.md).
- The score is a style heuristic. Accessibility, correctness, security and performance remain
  separate tests — the gate never replaces them.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE). The rule engine itself is not redistributed: it is fetched from
`https://ai-slop-checker.vercel.app/` at run time and belongs to its owners.
