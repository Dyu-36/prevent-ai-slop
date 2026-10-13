# Anti-pattern catalogue

Concrete patterns that read as template output, with a rewrite that keeps the page honest. The
rewrites are examples of the *kind* of change needed, not copy to paste verbatim.

## Metadata and scaffold leftovers

```html
<!-- slop -->
<title>Vite + React</title>
<meta name="generator" content="v0.dev">
<link rel="icon" href="/vite.svg">
```

```html
<!-- instead -->
<title>Invoicing for freelance translators — Ledgerly</title>
<meta name="description" content="Send an invoice in 30 seconds, get paid in 12 currencies. Built for one-person businesses.">
<meta property="og:title" content="Invoicing for freelance translators">
<meta property="og:image" content="/og/invoicing.png">
<link rel="icon" href="/icon.svg">
```

Also delete: `README.md` still describing the starter, "Edit `src/App.tsx` and save to reload",
unused starter logos, and any vendor badge the product did not choose.

## Hero copy

| Slop | Instead |
|---|---|
| "Empower your workflow with AI-powered solutions" | "Turn a folder of receipts into a tax-ready export in four minutes" |
| "The future of team collaboration" | "One shared timeline for teams of six to twenty" |
| "Seamlessly integrate everything, everywhere" | "Connects to Stripe, Xero and Gmail. Nothing else yet." |
| "Unlock your potential" | "Track the four lifts you actually train" |
| "It's not just a dashboard, it's a new way of working" | "A dashboard that refreshes every 30 seconds" |

The test: could a competitor's product page carry the same sentence unchanged? If yes, it says
nothing.

## Fake social proof

```tsx
// slop
const logos = ["Acme", "Globex", "Initech", "Umbrella", "Hooli"];
const testimonials = [
  { quote: "This changed everything for our team!", name: "Sarah J.", role: "CEO" },
  { quote: "Absolutely incredible product.", name: "John D.", role: "CTO" },
];
```

```tsx
// instead — real, verifiable, or absent
const logos = [{ name: "Kestrel Labs", href: "https://kestrellabs.com", note: "customer since 2024" }];
// No testimonial section until a real customer has agreed to be quoted, with a name and a link.
```

Rules: no star ratings nobody gave, no "Trusted by 10,000+ teams" without a source, no invented
avatars, no logo rows using companies that are not customers.

## Statistics

- Slop: "90% of teams report faster shipping" with no source, or a number that changed meaning
  between drafts.
- Instead: link the study, state the sample, or drop the number. If the number is your own,
  say so and show how it was measured ("median over 412 invoices sent in March 2025").

## Decoration standing in for design

```tsx
// slop
<h1 className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
  Supercharge your workflow
</h1>
<div className="absolute -top-20 left-1/2 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
<div className="grid grid-cols-3 gap-6">
  {features.map(f => <div className="rounded-xl border p-6"><Icon/><h3>{f.title}</h3><p>{f.body}</p></div>)}
</div>
```

```tsx
// instead
<h1 className="text-5xl font-semibold tracking-tight text-ink">Invoices that clear in a day</h1>
<figure className="mt-10">
  <img src="/product/invoice-editor.webp" alt="Invoice editor with a live VAT total" width={1280} height={720} />
  <figcaption className="mt-2 text-sm text-ink-muted">The editor as it ships today.</figcaption>
</figure>
```

The gradient headline, the blurred orb and the three-card feature grid are the three most
recognised tells. Replacing them with a real screenshot plus a stated claim is the single
highest-yield change on most generated landing pages.

## Palette and type

- Slop: `from-indigo-500 via-purple-500 to-pink-500`, `bg-lime-400`, `bg-slate-950` with neon
  `text-cyan-400`, and a font stack inherited from the scaffold.
- Instead: name the tokens (`--brand`, `--ink`, `--surface`, `--accent`), choose one typeface for
  display and one for text, and document the reason in the repo.
- Keep contrast: verify AA for both shipped themes rather than assuming.

## Motion

```tsx
// slop: every section fades in identically
<section className="opacity-0 translate-y-4 animate-in" data-scroll-reveal>...</section>
```

```tsx
// instead: motion only where it explains a change of state
<Toast role="status" className="transition-transform duration-150 data-[state=open]:translate-y-0" />
```

Respect `prefers-reduced-motion`. A uniform scroll reveal on twelve sections is filler, and it
hurts perceived performance.

## Navigation, forms and states

- Slop: five equal-weight CTAs in the header, "Get Started" repeated on every section, a nav with
  "Features / Pricing / Blog / About / Contact / Careers" copied wholesale.
- Instead: one primary action, secondary links only where a real reader needs them, and nav that
  reflects the actual product surface.
- Slop: empty states that say "No data yet", error states that say "Something went wrong".
- Instead: say what happened, what to do next, and how to recover.
- Slop: a dark-mode toggle that flips an unfinished theme.
- Instead: ship one finished theme, or finish both.

## Content the agent invented

Any of these is a defect regardless of how good it looks: invented company history, invented
team members, invented integrations, invented pricing, invented certifications, invented
security claims ("SOC 2 compliant", "end-to-end encrypted") that nobody verified. Delete it or
mark it explicitly as a placeholder for the owner to fill.
