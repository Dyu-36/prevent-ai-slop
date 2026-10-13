# Troubleshooting

## `Cannot fetch the original rule engine at ...`

The live checker is unreachable from this machine (offline, proxy, DNS, firewall). The audit
stops on purpose. Options, in order of preference:

1. Fix network access to `https://ai-slop-checker.vercel.app/` and rerun.
2. For a public deployment on another machine or network, run `--mode official` there.
3. Only when an offline number is genuinely required, run `--mode legacy` and label the result
   approximate everywhere it appears.

Never present a legacy number as the original's score, and never claim parity after a fetch
failure.

## `The original site no longer exposes window.__slopcheck`

The deployed app changed shape. The audit refuses to guess. Re-check the live page manually,
then either update `scripts/canonical-runner.mjs` to the new public API or fall back to
`--mode official` (which drives the UI rather than the JS API). Do not hand-copy rule logic into
this package.

## `Original checker did not produce a score in Nms`

Common causes, cheapest first:

- The page needed longer than `--result-timeout-ms`; raise it.
- The original site rejected the input (`#err` text is appended to the message) — often a private
  or unreachable URL, or a screenshot over the 12 MB limit.
- Remote providers (Microlink/Jina) rate-limited or refused to render the target; retry later.
- Selectors changed in the original UI; inspect the page and update `official-runner.mjs`.

## `The target did not render readable content`

The local page hydrated to an empty shell, so the score would be meaningless. Use
`--ready-selector '#hero'` (or whatever proves real content exists) and raise `--wait-ms`. For
pure client-rendered apps, prefer auditing a production build over a cold dev server.

## `--compare-official` reports a mismatch

Exit code 3 with `onlyOfficial[]` / `onlyLocal[]` signatures. Work through it in this order:

1. **Timing** — enter animations, font loading, lazy sections. Raise `--wait-ms`, add
   `--ready-selector`.
2. **Input capture** — the original fetches through Microlink at 1280×860 and Jina Reader, which
   can differ from a direct local navigation (cookies, auth, CORS, user agent, server variance).
3. **Pixels** — for an identical image file, differences should be minimal; for two different
   captures, expect drift.
4. **Bundle fallback** — a page whose visible text is under ~200 characters triggers the JS
   bundle fallback; that path can detect framework fingerprints the DOM alone does not.

A matching score with mismatching rules is still a mismatch. Report it honestly instead of
claiming equivalence.

## `Playwright not found in the project`

`npm install -D playwright && npx playwright install chromium` in the audited project. The CLI
resolves Playwright from the project's own `package.json`, not from this skill folder.

## Sandboxed or containerized runs

Set `SLOP_AUDIT_NO_SANDBOX=1` to launch Chromium with `--no-sandbox`, or pass
`--browser-path` to an existing Chromium build. Only do this in environments where you accept
the reduced isolation.
