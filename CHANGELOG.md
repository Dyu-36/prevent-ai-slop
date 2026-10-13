# Changelog

All notable changes to this bundle are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-13

### Added

- `prevent-ai-slop` skill: design-time rules, pre-flight checklist, anti-pattern catalogue with
  before/after rewrites, and a copy-paste `AGENTS.md` gate.
- `slop-fix` skill: defect-versus-decision triage, fix ordering, per-pattern playbook, and
  legitimate-exception recording.
- `slopcheck-audit` skill: the v2 audit CLI, canonical runner that calls the live checker's
  exported `analyze()`/`score()`, official runner that reads the live UI receipt, strict
  comparison, and the opt-in legacy approximation.
- `scripts/validate-skills.mjs`: enforces the skill standard (frontmatter, naming, description,
  body budget, resolvable relative references, parseable bundled scripts).
- Repository scaffolding: `AGENTS.md`, CI workflow, Claude Code plugin and marketplace
  manifests, security policy, contributing guide.

### Changed

- Restructured the standalone `ai-slop-agent-audit` package into a three-skill bundle. Skill
  folders are now self-contained and referenced by relative paths only.
- `scripts/test-scoring.mjs` moved to `skills/slopcheck-audit/tests/test-scoring.mjs`; contract
  fixtures were rebuilt to reproduce the documented Aizen reference shape (9% with `em dash +2`
  and a nominal `chosen typeface −6` credit capped to 5).
- CLI and report documentation consolidated into
  `skills/slopcheck-audit/references/api-reference.md`; scoring mechanics documented separately in
  `references/scoring-model.md`.

### Unchanged guarantees

- Loss of the original engine is exit code `1`, never a silent downgrade to approximate rules.
- Strict parity mismatch is exit code `3`; `--max-score` overflow is exit code `2`.
- The percentage is never presented as an AI-authorship probability.

[1.0.0]: https://github.com/Dyu-36/prevent-ai-slop/releases/tag/v1.0.0
