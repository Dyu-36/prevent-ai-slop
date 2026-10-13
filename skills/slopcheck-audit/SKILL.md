---
name: slopcheck-audit
description: Measure a web UI with the same detection and scoring engine as the live AI Slop Checker (ai-slop-checker.vercel.app). Use when a coding agent has finished or revised a React, Next.js, Vite, Vue, Svelte, static HTML or screenshot deliverable and a measured slop percentage with per-rule evidence is required, when a public deployment must be checked against the exact score the original site displays, or when a build gate needs a bounded score threshold. Produces JSON, Markdown and screenshot reports, and fails closed instead of silently substituting approximate heuristics.
license: MIT
---

# Slopcheck Audit

Produce a measured AI-slop reading for a web UI, together with the evidence behind it, using the
engine that already exists rather than a reimplementation of it.

**Source of truth.** This skill never guesses the rules. It either drives the original site's
interface (`official`) or executes the original site's exported `window.__slopcheck.analyze()`
and `score()` against locally captured input (`canonical`). The bundled `--mode legacy`
heuristics are approximate and opt-in only.

## Before running

- Node.js 20+ available to the audited project.
- Playwright plus Chromium: `npm install -D playwright && npx playwright install chromium`.
- The target must actually render content. A skeleton, an error page or a hydration failure
  yields a misleading number; use `--ready-selector` and `--wait-ms` to avoid that.

## Choose the mode before running anything

| Input | Mode | What the reported score is |
|---|---|---|
| Public `https://` URL | `official` | exactly the percentage the live checker displayed on that run |
| localhost, dev server, `--html`, `--image` | `canonical` | the original live engine applied to locally captured input |
| No route to the original site | `legacy` | an approximate clone, explicitly labelled as such |

`--mode auto` (the default) selects `official` for public URLs and `canonical` otherwise. A
`legacy` number must never be presented as the original's, and loss of the original engine is an
error (exit 1), not a downgrade.

## Run it

```bash
# Local dev app: original rules, locally captured DOM/CSS/pixels
node <SKILL_DIR>/scripts/slop-audit.mjs \
  --url http://localhost:3000 --mode canonical --wait-ms 3000 \
  --out .audit/slopcheck

# Public deployment: the exact score the original site shows
node <SKILL_DIR>/scripts/slop-audit.mjs \
  --url https://example.com --mode official --out .audit/official

# Strict parity check on a public URL or on an identical image file
node <SKILL_DIR>/scripts/slop-audit.mjs \
  --url https://example.com --mode canonical --compare-official \
  --out .audit/parity
```

`<SKILL_DIR>` is this skill's own folder wherever the agent installed it. Exit codes: `0`
success, `1` error or original unavailable, `2` above `--max-score`, `3` strict comparison
mismatch. Every flag and report field is documented in `references/api-reference.md`.

## Read the reports

- `PREFIX.json` — machine-readable: mode, engine SHA-256, score, `findings[]`, `credits[]`,
  capture coverage, parity diff, optional gate result.
- `PREFIX.md` — the same content for a human, with the caveat that the percentage is a
  template-pattern measure and not an authorship probability.
- `PREFIX.png` — in `canonical` the target page; in `official` the original checker's own result
  panel (not the target).

Inspect every `findings[]` entry: category, rule id, points, roast, why and quoted evidence.
Then hand remediation to the `slop-fix` skill and the build-time rules to `prevent-ai-slop`.

## Reporting rules

1. State the mode, and whether the result came from the original UI, the original engine on
   locally acquired input, or an opt-in approximation.
2. Never describe the score as the probability that AI authored the site.
3. Never claim the original was tested when fetching it failed. Fixture-based runs prove wiring
   only; `capture.note` marks them `CONTRACT TEST ONLY`.
4. Report before/after scores, removed detections, remaining intentional exceptions and the
   tradeoffs accepted. Keep the fix loop bounded (three passes is usually enough).
5. Treat the score as a style heuristic. Accessibility, correctness, security and performance
   remain separate tests.

## Project gate snippet

```markdown
## Post-build slop gate

After changing any landing page or frontend, run the canonical audit against the running app:

  node .agents/skills/slopcheck-audit/scripts/slop-audit.mjs \
    --url http://localhost:3000 --mode canonical --wait-ms 3000 --out .audit/slopcheck

Read .audit/slopcheck.json / .md / .png, fix real generic-pattern defects, rerun (max 3 passes),
and report mode, before/after score and remaining exceptions. Use --mode official for public
URLs. Never game the score by deleting real content. --mode legacy is approximate and must not
be substituted silently.
```

## Safety and trust boundaries

- `official` mode sends the URL to the original site, which uses external extraction and model
  providers. Public URLs only; never pass secrets, authenticated URLs, internal hostnames or
  unpublished user content.
- `canonical` mode blocks the engine page's network requests after downloading it, and keeps the
  target markup and pixels in the local browser. The executable engine is still third-party code
  fetched at run time: audit only in a browser environment you trust.
- Screenshots are limited to PNG/JPG/WebP and 12 MB, matching the original input limit.

## Reference map

- `references/api-reference.md` — every CLI flag, report field and exit code
- `references/parity.md` — exactly what is and is not guaranteed per mode
- `references/rules.md` — rule categories and where points come from
- `references/scoring-model.md` — caps, baseline, credits, verdict bands, worked example
- `references/troubleshooting.md` — engine unreachable, no score, hydration, parity mismatch
- `scripts/slop-audit.mjs` — CLI entry point and report orchestration
- `scripts/canonical-runner.mjs` — calls the original `analyze()`/`score()` without copying them
- `scripts/official-runner.mjs` — drives the original UI and reads its rendered receipt
- `scripts/comparison.mjs` — strict score, rule and credit comparison
- `scripts/browser-rules.mjs`, `scripts/scoring.mjs` — legacy opt-in approximation
- `tests/` — unit and browser contract tests; mocks do not prove live-site parity
