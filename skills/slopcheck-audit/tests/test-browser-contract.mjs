import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile, mkdtemp} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {join,dirname,resolve} from 'node:path';
import {createRequire} from 'node:module';
const fixtures=join(dirname(fileURLToPath(import.meta.url)),'fixtures');
const cli=resolve(fixtures,'../../scripts/slop-audit.mjs');
const req=createRequire(resolve(process.cwd(),'package.json'));
const playwrightReady=['playwright','playwright-core'].some(n => {try {req(n);return true;}catch{return false;}});
const browserPath=process.env.SLOP_TEST_CHROMIUM || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':null);
const browserArgs=browserPath?['--browser-path',browserPath]:[];
const env={...process.env,SLOP_AUDIT_NO_SANDBOX:process.env.SLOP_AUDIT_NO_SANDBOX||'1'};
const run=(args)=>spawnSync(process.execPath,[cli,...args,...browserArgs],{cwd:process.cwd(),env,encoding:'utf8',timeout:60000});

const mode={skip:!playwrightReady?'Install playwright or playwright-core to run browser contract tests':false};

test('canonical mode passes HTML/CSS through original exposed API and receives 9% contract result', mode, async()=>{
  const folder=await mkdtemp(join(tmpdir(),'slop-can-'));
  const prefix=join(folder,'audit');
  const r=run(['--html',join(fixtures,'aizen-like.html'),'--mode','canonical','--engine-html',join(fixtures,'original-engine-contract.html'),'--out',prefix,'--wait-ms','0']);
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(await readFile(prefix+'.json','utf8'));
  assert.equal(report.score,9);
  assert.equal(report.findings[0].id,'dashlite');
  assert.equal(report.credits[0].points,6);
  assert.equal(report.totals.creditPoints,5);
  assert.match(report.capture.note,/CONTRACT TEST ONLY/);
});

test('official mode parses displayed receipt 9%, without its own scoring',mode,async()=>{
  const folder=await mkdtemp(join(tmpdir(),'slop-ui-'));
  const prefix=join(folder,'audit');
  const r=run(['--url','https://aizen.talmetis.com/','--mode','official',
    '--official-html',join(fixtures,'original-ui-contract.html'),'--out',prefix,'--result-timeout-ms','3000']);
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(await readFile(prefix+'.json','utf8'));
  assert.equal(report.score,9);
  assert.equal(report.findings[0].category,'nitpick');
  assert.equal(report.findings[0].points,2);
  assert.equal(report.credits[0].points,6);
  assert.match(report.capture.note,/CONTRACT TEST ONLY/);
});

test('live engine missing must fail closed, no fallback to legacy scoring',mode,async()=>{
  const folder=await mkdtemp(join(tmpdir(),'slop-bad-'));
  const prefix=join(folder,'audit');
  const r=run(['--html',join(fixtures,'aizen-like.html'),'--mode','canonical',
    '--engine-html',join(fixtures,'aizen-like.html'),'--out',prefix]);
  assert.equal(r.status,1,r.stdout+'\n'+r.stderr);
  assert.match(r.stderr,/no longer exposes window.__slopcheck/);
  assert.equal(existsSync(prefix+'.json'),false);
});

test('score gate uses native result and exits 2 above threshold',mode,async()=>{
  const folder=await mkdtemp(join(tmpdir(),'slop-gate-'));
  const prefix=join(folder,'audit');
  const r=run(['--html',join(fixtures,'aizen-like.html'),'--mode','canonical','--engine-html',join(fixtures,'original-engine-contract.html'),
    '--out',prefix,'--max-score','8','--wait-ms','0']);
  assert.equal(r.status,2,r.stderr);
  const report=JSON.parse(await readFile(prefix+'.json','utf8'));
  assert.equal(report.gate.pass,false);
  assert.equal(report.gate.threshold,8);
});

test('legacy mode is opt-in only and labels itself approximate',mode,async()=>{
  const folder=await mkdtemp(join(tmpdir(),'slop-legacy-'));
  const prefix=join(folder,'audit');
  const r=run(['--html',join(fixtures,'aizen-like.html'),'--mode','legacy','--out',prefix,'--wait-ms','0']);
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
  const report=JSON.parse(await readFile(prefix+'.json','utf8'));
  assert.equal(report.mode,'legacy');
  assert.match(report.capture.note,/Not verified equivalent/i);
  assert.equal(typeof report.score,'number');
});
