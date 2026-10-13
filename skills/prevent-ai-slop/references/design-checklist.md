# Design-time checklist

Walk this before declaring a UI finished. It is grouped by the categories the checker measures,
so completing it also predicts the audit result. Every item is a decision to make on purpose,
not a rule to obey blindly: if you keep an item, be able to say why in one sentence.

## 1. Fingerprint — is this page unmistakably ours?

- [ ] `<title>` names the product and the page, not the framework.
- [ ] `<meta name="description">` and Open Graph/Twitter tags are written, not generated.
- [ ] Favicon, `theme-color`, `lang` and canonical URL are set.
- [ ] No generator/scaffold meta tags, no leftover "built with" badge, no vendor logo.
- [ ] No default starter strings anywhere: "My App", "Vite + React", "Create Next App",
      "Welcome to your new app", "Edit `src/App.tsx`", unmodified boilerplate README.
- [ ] The app's name, nav labels and footer are specific to this product.
- [ ] A first-time visitor can tell what the product is within five seconds without scrolling.

## 2. Copy — would a person say this out loud?

- [ ] The hero states a concrete claim about a concrete reader, not a mood.
- [ ] No generic verbs of empowerment: empower, unlock, elevate, supercharge, revolutionise,
      seamlessly, effortlessly, next-generation, cutting-edge, game-changing.
- [ ] Every number on the page has a source you could link, or it is removed.
- [ ] No invented testimonials, customer counts, star ratings, "trusted by" logo rows or
      awards.
- [ ] No placeholder names, lorem ipsum, "Company Name", "Your tagline here".
- [ ] Section headings say what the section contains instead of "Why choose us" / "Our features".
- [ ] CTAs name the outcome ("Start a free trial", "Read the API docs"), not "Get started" on
      every button.
- [ ] Emoji are not used as bullet points or headings; em dashes are not used as a stylistic
      tic every other sentence.
- [ ] No filler transitions ("In today's fast-paced world", "It's not just X, it's Y").
- [ ] Claims are falsifiable and true for the current build; nothing promises unbuilt features.

## 3. Layout — is the structure carrying the argument?

- [ ] The page has a real information hierarchy: one primary action, not five equal ones.
- [ ] No gradient-clipped headline text used as the main visual idea.
- [ ] No blurred colour orbs, glows or mesh blobs behind the hero.
- [ ] No icon-card grid standing in for an explanation; cards contain substance or are removed.
- [ ] No stock photography, generic abstract 3D shapes or "diverse team in a meeting" imagery.
- [ ] Real product screenshots, real data or deliberate illustration are used instead.
- [ ] One spacing scale and one radius scale, applied consistently.
- [ ] Default component-library colours and default fonts are either intentional or replaced.
- [ ] The layout still works at 360 px wide, at 200% zoom and with a keyboard only.
- [ ] Repeated sections are not five copies of the same three-column block.

## 4. Visual — is the palette a decision?

- [ ] Purple/indigo→pink gradient, acid-lime accent and "dark plus neon glow" are used only if
      the brand owns them; otherwise they are replaced.
- [ ] Colour is defined as tokens with names, not sprinkled hex values.
- [ ] Text and UI contrast pass WCAG AA in both themes that ship.
- [ ] Decoration does not compete with content: no animated background behind body text.
- [ ] Imagery is either owned, licensed or generated deliberately — and attributed if required.

## 5. Nitpick — the small tells

- [ ] Typeface choice is deliberate and legible; framework defaults are not inherited by
      accident.
- [ ] Fade/slide-in-on-scroll is not applied uniformly to every section.
- [ ] A theme toggle exists only if the product needs one and both themes are finished.
- [ ] Emoji, icon-only buttons and decorative dividers each have a reason to exist.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] No dead links, no console errors, no layout shift on load.

## Pre-audit self-check

Before running the checker, answer these out loud. Any "no" is a defect to fix first, and it will
usually be cheaper than a fix pass after the audit:

1. Can you name the one distinctive decision on this page?
2. Can you name the real facts and assets behind every claim on it?
3. If you removed all decoration, would the page still make its case?
4. Would a competitor's page read identically if you swapped the logo?
