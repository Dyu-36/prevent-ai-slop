# Rule categories — the live engine is the source of truth, not this inventory

This skill deliberately does **not** hardcode the checker's ~40 heuristics. It calls the original
site's exposed analyzer at run time, so the rules cannot drift when the source site changes. The
tradeoff is that auditing requires network access and trust in the fetched script.

The categories observed at implementation:

| Category key | Cap | Examples |
|---|---:|---|
| `fingerprint` | 34 | Lovable/v0/Bolt signatures, framework default page titles |
| `copy` | 40 | generic hero copy, filler words, template section headings, unsourced stats, emoji or star testimonials, stock CTAs |
| `layout` | 36 | gradient text, decorative blur orbs, icon-card grids, stock imagery, default component-library colours, default fonts |
| `visual` | 18 | pixel-counted purple/indigo, acid-lime, dark background plus neon |
| `nitpick` | 18 | Next.js/Geist defaults, theme switch, one-column portfolio, fade effects, em dash, emoji, icons |

Positive credits observed: chosen typeface (nominal −6), clean copy, original image assets and
lighter display type. Ordinary credits are capped at 5 points for scoring, while a receipt may
display the full nominal value. Category points are capped before the exponential transform and
the +6 baseline are applied. The full formula, verdict bands and a worked example are in
`scoring-model.md`.

The original app uses rule-specific regexes, selectors and pixel thresholds. Those execute inside
the original live `window.__slopcheck.analyze()` rather than being duplicated here.
`scripts/browser-rules.mjs` and `scripts/scoring.mjs` exist only for `--mode legacy` and must
never be described as exactly matching the original.

Do not convert these style heuristics into a blanket "bad design" verdict. Accessibility,
correctness and usability require separate tests, and a detected pattern may be a deliberate
brand decision — see the `slop-fix` skill's exception guidance.
