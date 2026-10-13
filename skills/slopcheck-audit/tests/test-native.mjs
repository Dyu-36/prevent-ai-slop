import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptNativeResult} from '../scripts/canonical-runner.mjs';
import {isPublicUrl} from '../scripts/official-runner.mjs';
import {compareAudits} from '../scripts/comparison.mjs';
import {calculateScore} from '../scripts/scoring.mjs';

const aizen = {
  nativeFindings:[{cat:'nitpick', key:'dashlite', label:'em dash',pts:2,roast:'one em dash. we saw that.',why:'One dash in the copy.',quotes:[{note:'Aizen — code'}]}],
  nativeCredits:[{label:'chosen typeface',pts:6,detail:'Chosen font, not a template.'}],
  score:9, verdict:'okay, you actually have taste',cappedPoints:2,creditPoints:5,words:52,fromBundle:false,
};

test('Aizen original screenshot baseline +2 / -6 displays 9%, internally caps credits at 5', () => {
  const r=adaptNativeResult(aizen);
  assert.equal(r.score,9);
  assert.equal(r.findings[0].points,2);
  assert.equal(r.findings[0].id,'dashlite');
  assert.equal(r.credits[0].points,6);
  assert.equal(r.totals.creditPoints,5);
  assert.equal(r.totals.effectivePoints,3);
  assert.equal(calculateScore({findings:[{id:'dashlite',category:'nitpick',points:2}],credits:[{label:'chosen typeface',points:6}]}).score,9);
});

test('compare all findings/credits even if aggregate score is unchanged', () => {
  const local=adaptNativeResult(aizen);
  const official={score:9,findings:[{category:'nitpick',points:2,roast:local.findings[0].roast,label:'em dash'}],
    credits:[{label:'chosen typeface',points:6}]};
  assert.equal(compareAudits(local,official).match,true);
  const plusFade={...local,findings:[...local.findings,{category:'nitpick',points:3,roast:'fade-in',label:'fade'}]};
  const mismatched=compareAudits(plusFade,official);
  assert.equal(mismatched.match,false);
  assert.equal(mismatched.matchingScore,true);
  assert.equal(mismatched.matchingRules,false);
  assert.deepEqual(mismatched.onlyLocal,['nitpick::3::fade-in']);
  const changedCredits=compareAudits({...local,credits:[{label:'chosen typeface',points:5}]},official);
  assert.equal(changedCredits.matchingCredits,false);
});

test('official mode rejects localhost, internal and authenticated URLs', () => {
  for(const u of ['http://localhost:3000','http://127.0.0.1:8000','http://192.168.1.8','http://10.1.2.3','http://172.16.0.1','http://dev.internal','https://admin:secret@example.com'])
    assert.equal(isPublicUrl(u),false,u);
  for(const u of ['https://aizen.talmetis.com/','https://example.com'])assert.equal(isPublicUrl(u),true,u);
});
