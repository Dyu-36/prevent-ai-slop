# CLI and report API

Entry point: `node scripts/slop-audit.mjs` with exactly one input.

## Inputs and flags

| Flag | Meaning |
|---|---|
| `--url URL` | Web page to audit; include the scheme for clarity |
| `--image PATH` | Screenshot (PNG/JPG/WebP, max 12 MB); restricts rules to visual pixels |
| `--html PATH` | Static HTML input (does not run application hydration) |
| `--mode MODE` | `auto` (default), `official`, `canonical`, `legacy` |
| `--compare-official` | `canonical` only: compare a public URL or image against the original UI |
| `--out PREFIX` | Write `PREFIX.json`, `PREFIX.md`, and optionally `PREFIX.png` |
| `--max-score N` | Exit code 2 when the measured score exceeds `N` |
| `--wait-ms N` | Wait before capture on a locally rendered page (default 3000) |
| `--ready-selector CSS` | Wait for this element to be visible before capturing |
| `--timeout-ms N` | Navigation and fetch timeout (default 30000) |
| `--result-timeout-ms N` | How long to wait for the original UI result (default 90000) |
| `--browser-path PATH` | Chromium executable override |
| `--no-screenshot` | DOM/CSS rules only (`canonical` and `legacy`) |
| `--engine-html PATH` | Contract-test fixture; **not** the live engine |
| `--official-html PATH` | Contract-test fixture; **not** the real original UI |
| `--original-url URL` | Advanced: alternate URL serving the same official app API |
| `--help` | Usage text |

Exit codes: `0` success, `1` error or original unavailable, `2` above `--max-score`, `3` failed
strict comparison. An unavailable original never causes a silent fallback to legacy scoring.

## Report properties

- `tool`, `version`, `checkedAt`, `target`, `mode` — audit metadata.
- `score`, `verdict` — numeric percentage and text from the original runtime or UI (or an
  explicit legacy fallback).
- `findings[]` — `category`, `id`, `label`, `points`, `roast`, `why`, `evidence[]`. `official`
  results carry generated `official-N` ids because the UI does not expose internal rule keys.
- `credits[]` — `label`, `points` (nominal displayed value), `why`, optional `house`.
- `capture` — `mode`, `source`, optional `sha256` of the downloaded engine, `note`, `remoteFetch`.
- `coverage` — evidence availability flags for DOM, CSS and pixels. `official` can be partial
  when an external provider fails.
- `totals` — capped calculation detail in `canonical` mode; `null` in `official`, where the site
  does not expose its post-cap breakdown.
- `comparison` (when requested) — `officialScore`, `delta`, `matchingScore`, `matchingRules`,
  `matchingCredits`, `match`, `onlyOfficial[]`, `onlyLocal[]`, `officialFindings[]`,
  `officialCredits[]`.
- `gate` — present only when `--max-score N` was supplied.

## Behavior guarantees

- In `official`, `score` is read from the original checker result and never recomputed.
- In `canonical`, `score` comes from the original live `window.__slopcheck.score()` applied to
  the result of the original live `analyze()`.
- In `legacy`, `score` comes from a separate local imitation and is labelled approximate.
- Loss of access to the original engine is exit code 1, not an automatic downgrade.
- A strict parity mismatch is exit code 3; exceeding `--max-score` is exit code 2.

## Test-only overrides

`--engine-html` and `--official-html` substitute local fixtures. Results produced with them are
marked `CONTRACT TEST ONLY` in `capture.note` and must never be described as the original
website's score. This package deliberately does not redistribute the original site's JavaScript;
it is loaded from the user's trusted network as a runtime dependency.
