// Independent, deterministic implementation of the public slopcheck scoring mechanics.
// Scores measure matches to UI/copy tropes. They do NOT estimate AI authorship probability.
export const CAPS = Object.freeze({ fingerprint: 34, copy: 40, layout: 36, visual: 18, nitpick: 18 });
export const VERDICTS = [
  [12, 'Distinctive visual decisions'],
  [25, 'Mostly free of familiar template patterns'],
  [40, 'A few generic patterns remain'],
  [55, 'Several familiar AI-template patterns'],
  [70, 'High concentration of generic patterns'],
  [85, 'Very template-like design'],
  [101, 'Extremely repetitive template patterns'],
];

export function calculateScore({ findings = [], credits = [] } = {}) {
  const unique = new Map();
  for (const f of findings) {
    if (!f || !f.id || !Number.isFinite(f.points)) continue;
    const p = unique.get(f.id);
    if (!p || f.points > p.points) unique.set(f.id, f);
  }
  const list = [...unique.values()].sort((a, b) => b.points - a.points);
  const byCategory = {};
  for (const f of list) byCategory[f.category] = (byCategory[f.category] || 0) + f.points;
  const cappedByCategory = Object.fromEntries(
    Object.entries(byCategory).map(([key, n]) => [key, Math.min(CAPS[key] ?? 20, n)])
  );
  const cappedPoints = Object.values(cappedByCategory).reduce((a, b) => a + b, 0);
  const qualityCredits = Math.min(5, credits.filter((x) => !x.house).reduce((s, c) => s + (c.points ?? 0), 0));
  const houseCredits = credits.filter((x) => x.house).reduce((s, c) => s + (c.points ?? 0), 0);
  const creditPoints = qualityCredits + houseCredits;
  const effectivePoints = Math.max(0, cappedPoints + 6 - creditPoints);
  const score = Math.max(2, Math.min(99, Math.round(100 * (1 - Math.exp(-effectivePoints / 32)))));
  const verdict = VERDICTS.find(([max]) => score <= max)?.[1] ?? VERDICTS.at(-1)[1];
  return {
    score,
    verdict,
    findings: list,
    credits,
    totals: { byCategory, cappedByCategory, cappedPoints, creditPoints, effectivePoints, baselinePoints: 6 },
  };
}
