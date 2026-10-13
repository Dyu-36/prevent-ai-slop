# Fix playbook

Per-pattern rewrites. Each entry gives the detection, why it reads as slop, and the smallest
correct fix. Use the rule id and evidence from the audit report to find the matching entry.

## Fingerprint

| Detection | Fix |
|---|---|
| Default framework title ("Vite + React", "Create Next App") | Real `<title>`: product + page. Add `description`, OG/Twitter tags, favicon, `lang`. |
| Generator meta tag or vendor badge | Delete the tag; remove any "built with" mark the product did not choose. |
| Starter strings in the UI | Search the repo for "My App", "Welcome to", "Edit `src/App`", "Lorem", "Company Name" and replace with real content. |
| Unmodified starter README | Rewrite it for the actual product, or delete it. |
| No metadata at all | Add the metadata block; this is cheap and removes a whole class of detections. |

## Copy

Order of work: hero → section headings → CTAs → body → proof.

1. **Hero.** Rewrite as `[concrete outcome] for [concrete reader]`, in the product's own words.
   If the sentence would fit a competitor's site unchanged, it is still slop.
2. **Section headings.** Replace "Why choose us", "Our features", "How it works" with headings
   that state the actual content ("Invoices clear in one business day", "What the API returns").
3. **CTAs.** Name the outcome: "Start a free trial", "Read the API docs", "Book a 20-minute
   call". One primary action per page; demote the rest.
4. **Body.** Delete filler transitions, hedge words and adjective stacks. Replace "seamlessly
   integrate with your existing stack" with the list of what it actually connects to.
5. **Proof.** Link every statistic to a source and state the sample. Delete invented
   testimonials, star ratings, customer counts and logo rows. If no proof exists, ship the page
   without a proof section — an honest page beats a fabricated one.
6. **Punctuation and emoji.** Remove emoji used as bullets or headings. Keep at most one em dash
   where a human editor would use one.

## Layout

| Detection | Fix |
|---|---|
| Gradient-clipped headline | Plain headline in the ink colour; carry the visual idea with type scale, weight and spacing, or with real imagery. |
| Blurred orb / glow / mesh behind hero | Delete it. Replace the vertical rhythm with a real product screenshot, diagram or data. |
| Icon-card feature grid | Replace with two or three substantive blocks: a claim, its evidence, and what it costs. Keep cards only when each one carries distinct information. |
| Stock photography | Replace with the real product, real screenshots, real data, or a deliberate illustration. If nothing real exists yet, use type and structure rather than stock. |
| Mixed spacing/radius scales | Consolidate to one spacing scale and one radius scale, defined as tokens. |
| Five identical three-column sections | Merge into one section with the actual argument, or differentiate each by content type. |
| Broken narrow viewport | Fix the layout at 360 px, 200% zoom and keyboard-only navigation before rerunning the audit. |

## Visual

- Replace template gradients (`from-purple-500 to-pink-500`), acid-lime accents and
  "dark-plus-neon" palettes unless the brand genuinely owns them.
- Move colours into named tokens (`--brand`, `--ink`, `--surface`, `--accent`, `--danger`) and use
  the tokens in components. Unnamed hex values scattered across files are both slop and a
  maintenance problem.
- Verify WCAG AA contrast for text and interactive elements in every shipped theme.
- If the brand colour *is* one of the flagged palettes, keep it and record the reason; then make
  the rest of the page distinctive so the palette reads as a choice rather than a default.

## Nitpick

| Detection | Fix |
|---|---|
| Default framework font inherited by accident | Choose a display and a text typeface deliberately, or state why the default fits. |
| Uniform fade/slide-in on every section | Keep motion only where it explains a state change (loading, success, reorder). Respect `prefers-reduced-motion`. |
| Theme toggle nobody asked for | Either finish both themes properly or remove the toggle and ship one theme. |
| Emoji and decorative icons everywhere | Keep icons that aid recognition; remove those that only fill space. |
| One-column portfolio layout copied wholesale | Structure the page around the work: outcomes first, then evidence, then contact. |

## After fixing

Rerun the audit with the same mode and input, then diff `findings[]` by rule id. Confirm:

- the detections that disappeared were the ones you actually fixed;
- no new detections appeared (a rushed rewrite often trades one pattern for another);
- nothing that a reader needs was removed;
- accessibility, responsive behaviour and console output are still clean.

If a fix lowered the score but made the page worse, revert it and record the pattern as an
accepted exception.
