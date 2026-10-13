# Scoring model

The score is a style heuristic over detected template patterns. It is **not** the probability
that a model authored the page, and it is not a quality, correctness, accessibility, security or
performance measure.

## Formula

1. Only the highest instance of each rule key is kept.
2. Points are summed per category, then each category is capped:

   | Category | Cap |
   |---|---:|
   | `fingerprint` | 34 |
   | `copy` | 40 |
   | `layout` | 36 |
   | `visual` | 18 |
   | `nitpick` | 18 |

3. Positive credits are summed, but ordinary (non-`house`) credits are capped at **5** for
   scoring. The receipt may still display the full nominal value.
4. `effective = max(0, cappedPoints + 6 − creditPoints)` — the `+6` baseline exists so that a
   clean page is not reported as a perfect zero.
5. `score = clamp(round(100 × (1 − e^(−effective / 32))), 2, 99)`.

The exponential transform is why small point changes move the percentage little at the low end
and a lot in the middle: it is a saturating curve, not a linear penalty.

## Verdict bands

| Score | Verdict |
|---|---|
| ≤ 12 | Distinctive visual decisions |
| ≤ 25 | Mostly free of familiar template patterns |
| ≤ 40 | A few generic patterns remain |
| ≤ 55 | Several familiar AI-template patterns |
| ≤ 70 | High concentration of generic patterns |
| ≤ 85 | Very template-like design |
| ≤ 100 | Extremely repetitive template patterns |

## Worked example (Aizen, reference run)

- `em dash` finding: +2 (`nitpick`)
- `chosen typeface` credit: nominal −6, capped to 5 for scoring
- baseline: +6
- `effective = max(0, 2 + 6 − 5) = 3`
- `round(100 × (1 − e^(−3/32))) = 9%`

The browser contract fixtures reproduce this shape so that the credit cap cannot silently drift
again. Fixtures prove wiring only; they are not live parity evidence.

## Reading a delta

- Category caps mean adding a fourth `copy` detection above the cap changes nothing.
- A single high-value `fingerprint` hit (default framework metadata, generator signature) can
  dominate the number; fix that first.
- Credits only help up to 5 points unless the original marks them `house`, so "adding good
  things" is not a way to move the score much.
- A large score drop after a rewrite that deleted real content is a regression, not a win.
