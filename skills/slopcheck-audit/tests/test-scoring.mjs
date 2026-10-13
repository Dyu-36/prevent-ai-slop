import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore } from '../scripts/scoring.mjs';

const f = (id, category, points) => ({ id, category, points });

test('baseline without any hits is 17, not 0', () => {
  assert.equal(calculateScore().score, 17);
});

test('matches sample 35-point example (14 + 13 + 8)', () => {
  const r = calculateScore({ findings: [f('title', 'fingerprint', 14), f('hero', 'copy', 13), f('orb', 'layout', 8)] });
  assert.equal(r.totals.cappedPoints, 35);
  assert.equal(r.score, 72);
});

test('limits each category before nonlinear transformation', () => {
  const r = calculateScore({findings:[f('one','copy',30), f('two','copy',20), f('three','visual',25)]});
  assert.equal(r.totals.cappedByCategory.copy, 40);
  assert.equal(r.totals.cappedByCategory.visual, 18);
});

test('retains only the highest instance of each rule key', () => {
  const r = calculateScore({findings:[f('hero','copy',9), f('hero','copy',13)]});
  assert.equal(r.findings.length, 1);
  assert.equal(r.totals.cappedPoints,13);
});

test('quality credits are capped at 5 points even when numerous', () => {
  const r = calculateScore({credits:[{points:6}, {points:6}]});
  assert.equal(r.totals.creditPoints, 5);
  assert.equal(r.score, 3);
});

test('clamps scores between 2 and 99', () => {
  assert.equal(calculateScore({findings: Array.from({length:100},(_,n)=>f(`x${n}`, `category${n}`, 999))}).score,99);
  assert.equal(calculateScore({credits:[{points:6}, {points:6}]}).score >=2,true);
});
