# Legitimate exceptions

The checker measures pattern matches, not intent. Some detected patterns are the right choice.
Keeping them is allowed and expected — the failure mode is keeping them *silently*.

## Keep the pattern when

- **The brand owns it.** The gradient, the lime accent or the dark-neon palette is the product's
  identity, used in the logo, the packaging and the app. Keep it, and note where the brand
  decision is recorded.
- **It communicates state.** A fade that marks a background job finishing, a pulse that marks
  unsaved changes, a colour that marks an error — motion and colour with meaning are not filler.
- **The proof is real.** A named customer quote with permission, a logo row of actual paying
  customers, a statistic with a linked source. Real proof is not fake social proof.
- **The default is genuinely correct.** A framework default font can be the right call for a
  developer tool that should feel native. Say that in one sentence.
- **Accessibility or platform requires it.** Reduced-motion fallbacks, focus rings, system colour
  schemes and native form controls may look plain but are required.
- **Removing it would remove substance.** If the "icon-card grid" is the only place the pricing
  tiers are explained, the fix is to improve the content, not to delete the section.

## Remove the pattern when

- The reason is "the layout looked empty" or "the template had it".
- The reason is "it lowers the score" in either direction — gaming the metric up or down.
- The content behind it is invented, unverifiable or placeholder.
- It duplicates another section without adding information.
- It is inherited from a scaffold or a component library default that nobody chose.

## Recording an exception

Write one line per kept detection in the delivery summary:

```text
kept: layout/gradient-headline — brand gradient, defined in brand/identity.md §2, used across
      packaging; the headline is the only gradient text on the page.
kept: nitpick/theme-toggle — dark mode is a shipped feature with a finished palette.
```

An exception without a reason is indistinguishable from an unfixed defect, so the reason is part
of the deliverable, not an optional note.

## Escalate instead of deciding alone

Ask the owner when the pattern is tied to a business claim you cannot verify (customer counts,
certifications, security properties), when removing it changes the product's meaning, or when the
brand guideline and the audit disagree. Present the tradeoff with the audit evidence rather than
silently choosing one side.
