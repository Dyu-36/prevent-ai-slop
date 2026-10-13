---
name: prevent-ai-slop
description: Prevent generic AI-template patterns ("AI slop") in web interfaces built by coding agents. Use when starting, redesigning or reviewing a landing page, marketing site, dashboard, portfolio or any React, Next.js, Vite, Vue, Svelte or static HTML UI that must look deliberate rather than template-generated, and when a user says a result looks generic, templated or AI-generated. Supplies the design-time checklist and copy rules, then hands measurement to the slopcheck-audit skill and remediation to slop-fix.
license: MIT
---

# Prevent AI Slop

"AI slop" is not a claim about who wrote the code. It is a set of observable, repeatable
fingerprints: default framework metadata, filler marketing copy, decorative gradients and blur
orbs, icon-card grids, stock imagery, fake social proof, and the small tells that survive every
template. This skill keeps them out of a build, then verifies what is left with the same engine
as the live [AI Slop Checker](https://ai-slop-checker.vercel.app/).

## Non-negotiables

1. **A score is not an authorship probability.** It measures template-pattern matches. Report it
   as such, never as proof that a model wrote the page.
2. **Never degrade the product to lower a number.** Deleting real content, disabling a
   meaningful animation or hiding information to satisfy a heuristic is a regression, not a fix.
3. **Content before decoration.** Decide what the page must say and to whom, then design the
   smallest structure that carries it. Decoration is the last 10%.
4. **Accessibility, correctness, security and performance are separate tests.** Passing this
   skill's gate proves none of them.

## The build loop

1. **Brief before markup.** Write one sentence of audience, one of the single action the page
   must drive, and a list of the real facts, numbers, names and assets available. If the facts
   do not exist yet, do not invent placeholders that read like a template.
2. **Choose one distinctive decision** and make it structural, not cosmetic: a specific type
   scale, an unusual but legible layout grid, a real illustration or product screenshot, an
   editorial voice. One deliberate choice beats ten decorative ones.
3. **Walk the design-time checklist** in `references/design-checklist.md` before you consider the
   UI done. It is grouped by the five categories the checker measures, so it doubles as a
   pre-audit.
4. **Measure, do not guess.** Run the `slopcheck-audit` skill against the running app
   (`--mode canonical` for localhost, `--mode official` for a public URL) and read the per-rule
   evidence instead of eyeballing it.
5. **Remediate with the `slop-fix` skill**, which separates genuine defects from legitimate
   brand decisions and keeps the loop bounded to about three passes.
6. **Report** mode, before/after score, detections removed, exceptions kept and tradeoffs.

## Highest-yield rules

### Fingerprint: prove the page is yours

- Set a real `<title>`, description, Open Graph tags, favicon and `lang`.
- Remove scaffold leftovers: framework default titles, generator meta tags, "My App", "Vite +
  React", unmodified starter READMEs and logos.
- Never leave a vendor badge or "built with" mark that the product did not choose.

### Copy: write sentences a person would say

- Replace generic hero copy ("Empower your workflow", "The future of X", "Seamlessly integrate")
  with the concrete claim and the concrete reader.
- No unsourced statistics, no invented customer counts, no fake testimonials or star ratings, no
  placeholder logos.
- Kill filler transitions and hedge words; state the thing.
- Emoji as bullet decoration, and em dashes used as a stylistic tic, both read as machine
  output. Use them only where a human editor would.

### Layout: structure, not garnish

- No gradient-filled headline text, no blurred colour orbs behind the hero, no icon-card grid
  used as a substitute for an argument.
- Do not ship default component-library colours and default fonts unchanged; pick a palette and a
  typeface on purpose and say why.
- Avoid stock photography and generic abstract 3D shapes; use the real product, real screenshots
  or a deliberate illustration.
- Keep one spacing scale and one radius scale instead of mixing five.

### Visual: colour with intent

- Purple/indigo-to-pink gradients, acid-lime accents, and "dark background plus neon glow" are
  the most recognised template palette. Use them only if the brand genuinely owns them.
- Contrast must pass WCAG regardless of the aesthetic choice.

### Nitpick: the small tells

- One deliberate typeface beats a default system stack chosen by accident; if you use a
  framework default font, do it because it fits.
- Fade-in-on-scroll applied to every section, a theme toggle nobody asked for, and single-column
  portfolios copied wholesale are the classic filler.
- Prefer fewer, purposeful interactions to a uniform entrance animation on everything.

## Project rules for coding agents

`assets/agents-gate-snippet.md` is a copy-paste block for a project's `AGENTS.md` (or equivalent)
that makes the build-time rules and the post-build audit gate part of the normal loop.

## Reporting

State what was changed and why, the audit mode used, the before/after score, the detections that
were removed, and any pattern kept on purpose with the reason. Never present a fixture-based or
legacy-mode number as the original checker's result.

## Reference map

- `references/design-checklist.md` — the pre-flight checklist, grouped by measured category
- `references/anti-patterns.md` — catalogue of patterns with concrete before/after rewrites
- `assets/agents-gate-snippet.md` — project-level `AGENTS.md` block to copy
