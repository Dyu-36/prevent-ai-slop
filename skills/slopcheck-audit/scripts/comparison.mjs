/** Compare native rules/credits, not just a nonlinear aggregate score. */
export function compareAudits(local, official) {
  const signature = f => `${f.category}::${f.points}::${f.roast}`;
  const localRules = local.findings.map(signature);
  const officialRules = official.findings.map(signature);
  const creditSignature = c => `${c.label}::${c.points}`;
  const localCredits = local.credits.map(creditSignature);
  const officialCredits = official.credits.map(creditSignature);
  const matchingScore = local.score === official.score;
  const matchingRules = JSON.stringify(localRules) === JSON.stringify(officialRules);
  const matchingCredits = JSON.stringify(localCredits) === JSON.stringify(officialCredits);
  return {
    officialScore:official.score,
    delta:local.score - official.score,
    matchingScore, matchingRules, matchingCredits,
    match:matchingScore && matchingRules && matchingCredits,
    onlyOfficial:officialRules.filter(x => !localRules.includes(x)),
    onlyLocal:localRules.filter(x => !officialRules.includes(x)),
    officialFindings:official.findings.map(f => ({label:f.label,points:f.points,category:f.category,roast:f.roast})),
    officialCredits:official.credits.map(c => ({label:c.label,points:c.points})),
  };
}
