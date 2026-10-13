## Frontend slop gate

Applies to every change to a landing page, marketing page, dashboard or portfolio in this repo.

**While building**

1. Write the audience sentence and the one primary action before writing markup.
2. Use real content, real numbers and real assets. Never invent testimonials, customer counts,
   statistics, team members, integrations or compliance claims.
3. Do not use gradient-clipped headlines, blurred colour orbs, icon-card grids as argument
   substitutes, stock photography, or default component-library colours and fonts unchanged.
4. Run the pre-flight checklist in `.agents/skills/prevent-ai-slop/references/design-checklist.md`
   before considering the UI done.

**Before delivering**

5. Start the app and wait until real content renders (not a skeleton).
6. Run the audit and read the evidence:

   ```bash
   node .agents/skills/slopcheck-audit/scripts/slop-audit.mjs \
     --url http://localhost:3000 --mode canonical --wait-ms 3000 \
     --out .audit/slopcheck
   ```

7. Fix genuine generic-pattern defects with `.agents/skills/slop-fix/SKILL.md` and rerun. Cap the
   loop at three passes.
8. On a public deployment, use `--mode official` for the exact score the original checker shows.
   For strict parity troubleshooting, run `--mode canonical --compare-official` and investigate
   mismatching rules/credits even when the score matches.
9. Report the mode, before/after score, detections removed, and any pattern kept on purpose with
   the reason.

**Never**

- Delete real content, hide information or disable meaningful animation to lower the score.
- Present `--mode legacy` output as the original checker's result; it is approximate and opt-in.
- Continue silently if the original engine cannot be fetched — fail the audit explicitly.
- Describe the percentage as the probability that AI wrote the page.
- Send private URLs, internal hostnames or secrets to the public checker.

The slop gate does not replace functional, accessibility, security or performance testing.
