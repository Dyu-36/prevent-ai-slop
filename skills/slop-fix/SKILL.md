---
name: slop-fix
description: Remove generic AI-template patterns from a web UI after an audit has flagged them. Use when a slopcheck-audit report (or a reviewer) has produced specific findings such as default framework metadata, generic hero copy, fake social proof, gradient headline text, blur orbs, icon-card grids, stock imagery, template palettes or filler motion, and the page must be fixed without degrading the product. Classifies each finding as a real defect or a legitimate brand decision, applies the smallest correct change, and reruns the audit to confirm.
license: MIT
---

# Slop Fix

Turn audit findings into changes that improve the page rather than flatter the number. This skill
assumes a report already exists — if not, run the `slopcheck-audit` skill first, and use
`prevent-ai-slop` for the design-time rules that stop the patterns appearing again.

## The first decision: defect or decision?

For every finding, ask the two questions in this order.

| Question | If yes | If no |
|---|---|---|
| Would a careful human designer look at this and call it filler? | It is a defect — fix it. | Go to the next question. |
| Can you name the specific product reason this exists? | It is a legitimate decision — keep it and record the reason. | It is a defect — fix it. |

A legitimate decision looks like: "the brand's own indigo is `#4338CA`, chosen in 2023 and used
in the physical product"; "the fade communicates that a background job finished"; "this
testimonial is from a named customer who approved the quote". Everything else — "it looked
empty", "the template had it", "it balances the section" — is filler.

Full classification guidance, including the exceptions that look like defects but are not, is in
`references/legitimate-exceptions.md`.

## Fix order

Fix in this order; earlier items move the score more and cost less.

1. **Fingerprint** — real `<title>`, description, OG tags, favicon; delete scaffold strings,
   starter READMEs and unchosen vendor badges.
2. **Copy** — hero claim, section headings, CTAs, then the body. Remove unsourced statistics and
   all invented proof. This is usually the largest single win.
3. **Layout** — replace gradient headlines, blur orbs, icon-card grids and stock imagery with
   real structure and real product imagery.
4. **Visual** — replace template palettes and default component colours with named tokens; verify
   contrast.
5. **Nitpick** — reduce motion to what communicates, resolve font defaults deliberately, remove
   the unrequested theme toggle.

Detailed per-pattern rewrites are in `references/fix-playbook.md`.

## Rules while fixing

- **Smallest correct change.** Rewrite the sentence; do not delete the section. Swap the image;
  do not delete the feature.
- **Never remove substance to move a number.** If a fix would make the page less useful, less
  accurate or less accessible, it is the wrong fix.
- **Keep the design system intact.** Fix slop by making deliberate choices, not by adding a new
  competing palette, font or spacing scale.
- **Stay within the brand.** If the brand genuinely owns a pattern the checker dislikes, keep it
  and say so in the report.
- **Do not add decoration to raise credits.** Chasing positive credits with decorative extras is
  the same failure in the other direction.
- **Re-verify after every pass** with the same mode and the same input as the original audit, so
  the delta is comparable.

## Loop

```bash
# 1. Audit
node <SKILL_DIR>/scripts/slop-audit.mjs --url http://localhost:3000 --mode canonical \
  --wait-ms 3000 --out .audit/slopcheck-before

# 2. Fix defects (this skill), then rerun into a second prefix
node <SKILL_DIR>/scripts/slop-audit.mjs --url http://localhost:3000 --mode canonical \
  --wait-ms 3000 --out .audit/slopcheck-after
```

`<SKILL_DIR>` refers to the `slopcheck-audit` skill folder. Compare `findings[]` between the two
reports by rule id: the goal is fewer *real* detections, not a smaller number achieved by
deletion. Stop after three passes and report what remains, including anything kept on purpose.

## Report

- Mode used and whether the number came from the original UI or the original engine on local
  input.
- Before/after score, with the rule ids that disappeared and the ones that remain.
- For each remaining detection: the product reason it was kept.
- Anything you could not fix without a product decision, phrased as a question for the owner.

## Reference map

- `references/fix-playbook.md` — per-pattern rewrites with before/after examples
- `references/legitimate-exceptions.md` — when a detected pattern is the right choice
