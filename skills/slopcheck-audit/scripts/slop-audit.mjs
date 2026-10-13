#!/usr/bin/env node
/** AI Slop Agent Audit, v2. Canonical modes use slopcheck's own live engine/UI. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {makeEngine,inspectWithOriginalEngine,imageMime,ORIGINAL_SITE} from './canonical-runner.mjs';
import {runOfficial,isPublicUrl} from './official-runner.mjs';
import {inspectPage} from './browser-rules.mjs';
import {calculateScore} from './scoring.mjs';
import {compareAudits} from './comparison.mjs';

const HELP=`
AI Slop Agent Audit v2 — the original slopcheck engine, not a guessed clone
Usage:
  node scripts/slop-audit.mjs --url http://localhost:3000 --out .audit/aizen
  node scripts/slop-audit.mjs --url https://example.com --mode official
  node scripts/slop-audit.mjs --image ./screenshot.png --mode canonical

Input (exactly one): --url URL | --image PATH | --html PATH
  --mode auto|official|canonical|legacy   default: auto
    auto:     original website UI for PUBLIC URLs; canonical for localhost/files
    official: actual deployed website and its real receipt (public URL/image)
    canonical: original site's LIVE analyze()/score() with locally captured input
    legacy:   independent approximate rules ONLY; never used silently
  --compare-official    In canonical mode, compare a public URL OR image with original UI
  --out PREFIX         Report file prefix (default: ./slop-audit-report)
  --max-score N        Exit code 2 if measured score exceeds N
  --wait-ms N          Milliseconds to let target site hydrate (default: 3000)
  --ready-selector CSS Wait for target page to render this element
  --timeout-ms N       Browser/navigation timeout (default: 30000)
  --result-timeout-ms N  Wait for original UI result (default: 90000)
  --browser-path PATH  Chromium executable override
  --no-screenshot      DOM/CSS only, canonical or legacy mode
  --engine-html PATH   Test fixture: load a local engine instead of the live site
  --official-html PATH Test fixture: load a local mock UI instead of the real site
  --original-url URL   Advanced: alternate URL serving the same official app API
  --help

Outputs: PREFIX.json, PREFIX.md, optionally PREFIX.png
Codes: 0 success | 1 unavailable/incomplete | 2 exceeds --max-score | 3 parity comparison mismatch
`;
function parseArgs(argv){
  const args={mode:'auto',output:'slop-audit-report',waitMs:3000,timeoutMs:30000,resultTimeoutMs:90000,screenshot:true};
  const keys={'--url':'url','--image':'image','--html':'html','--out':'output','--mode':'mode','--max-score':'maxScore','--wait-ms':'waitMs','--ready-selector':'selector','--timeout-ms':'timeoutMs','--result-timeout-ms':'resultTimeoutMs','--browser-path':'browserPath','--engine-html':'engineHtml','--official-html':'officialHtml','--original-url':'originalUrl'};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==='--help'||a==='-h'){args.help=true;continue;}
    if(a==='--compare-official'){args.compareOfficial=true;continue;}
    if(a==='--no-screenshot'){args.screenshot=false;continue;}
    if(!keys[a]) throw new Error(`Unknown argument: ${a}`);
    if(!argv[i+1])throw new Error(`Expected a value after ${a}`);
    args[keys[a]]=argv[++i];
  }
  if(args.help)return args;
  if([args.url,args.image,args.html].filter(Boolean).length!==1)throw new Error('Specify one of --url, --image, --html.');
  if(!['auto','official','canonical','legacy'].includes(args.mode))throw new Error('Invalid --mode.');
  for(const prop of ['waitMs','timeoutMs','resultTimeoutMs']){
    args[prop]=Number(args[prop]);
    if(!Number.isInteger(args[prop])||args[prop]<0||args[prop]>180000)throw new Error(`Invalid ${prop}.`);
  }
  if(args.maxScore!==undefined){args.maxScore=Number(args.maxScore);if(!Number.isFinite(args.maxScore)||args.maxScore<0||args.maxScore>100)throw new Error('--max-score must be between 0 and 100.');}
  if(args.image)args.image=resolve(args.image);
  if(args.html)args.html=resolve(args.html);
  if(args.url){
    const v=args.url;
    const u=new URL(/^[a-z][\w+.-]*:\/\//i.test(v)?v:(/^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(v)?`http://${v}`:`https://${v}`));
    if(!['http:','https:'].includes(u.protocol))throw new Error('Only http(s) site URLs supported.');
    args.url=u.href;
  }
  if(args.mode==='auto')args.mode=args.url&&isPublicUrl(args.url)?'official':'canonical';
  if(args.compareOfficial && args.mode!=='canonical')throw new Error('--compare-official requires --mode canonical.');
  return args;
}
function loadPlaywright(){
  const req=createRequire(resolve(process.cwd(),'package.json'));
  for (const pkg of ['playwright','playwright-core']){try{return req(pkg);}catch{}}
  throw new Error('Playwright not found in the project. Install with: npm install -D playwright && npx playwright install chromium');
}
const escapeTable = s=>String(s??'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
function markdown(r){
  const headings=[`# AI Slop Audit — ${r.score}%`,
    `**Target:** ${r.target}  `,
    `**Mode:** ${r.mode}  `,
    `**Verdict:** ${r.verdict}  `,
    `**Scoring:** ${r.capture.note}  `,
    `**Checked at:** ${r.checkedAt}  `,
    `**Interpretation:** this percentage measures template-pattern detections, NOT AI authorship probability.`,
    ''];
  if(r.warning)headings.push(`**Warning:** ${r.warning}`,'');
  if(r.comparison)headings.push('## Comparison against the official result',`Official: **${r.comparison.officialScore}%** | Canonical local capture: **${r.score}%** | Delta: **${r.comparison.delta}** | All three (score, rules, credits) match: **${r.comparison.match?'yes':'NO'}**`,'');
  headings.push('## Detected patterns', '| Group | Rule | Score | Evidence |','|---|---|---:|---|');
  for(const f of r.findings)headings.push(`| ${escapeTable(f.category)} | ${escapeTable(f.label)} | +${f.points} | ${escapeTable(f.evidence?.slice(0,2).join('; '))} |`);
  if(!r.findings.length)headings.push('| — | No matching pattern | 0 | — |');
  headings.push('', '## Positive credits');
  for(const c of r.credits)headings.push(`- ${c.label}: −${c.points}. ${c.why||''}`);
  if(!r.credits.length)headings.push('- None');
  headings.push('', '## Detail & action');
  for(const f of r.findings)headings.push(`### ${f.label} (+${f.points})`,`- ${f.why||f.roast||'Detected by the original checker.'}`,f.evidence?.length?`- Evidence: ${f.evidence.join('; ')}`:'', '');
  headings.push('## Coverage',`- Source: ${r.capture.source}`,`- Engine SHA-256: ${r.capture.sha256 || 'read directly from original UI'}`,
    `- DOM: ${r.coverage.html?'yes':'no'}; CSS: ${r.coverage.css?'yes':'unknown'}; Screenshot: ${r.coverage.pixels?'yes':'no'}`,
    `- ${r.mode==='official'?'Score is the one actually shown by the original website.':'Rule evaluator and scorer are original; target capture pipeline differs from Microlink/Jina.'}`,
    '- Do not “fix” valid product choices merely to game a heuristic score.');
  return headings.filter(x=>x!==undefined).join('\n')+'\n';
}
async function readCss(page){
  const {inline,links}=await page.evaluate(() => ({
    inline:[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n'),
    links:[...document.querySelectorAll('link[rel~="stylesheet"]')].slice(0,4).map(x=>x.href).filter(Boolean),
  }));
  const parts=await Promise.all(links.map(async url=>{
    try{const response=await page.request.get(url,{timeout:4000}); if(!response.ok())return '';
      const body=await response.body(); return body.length>3_000_000?'':body.toString('utf8');
    }catch{return '';}
  }));
  return [inline,...parts].join('\n');
}
async function readBundle(page, html, base, timeoutMs){
  const src=await page.evaluate(input => {
    const parsed=new DOMParser().parseFromString(input.html,'text/html');
    const script=parsed.querySelector('script[type="module"][src]')||[...parsed.querySelectorAll('script[src]')].find(s=>/index|main|app/.test(s.getAttribute('src')||''));
    if(!script)return null;
    try{return new URL(script.getAttribute('src'), input.base).href;}catch{return null;}
  },{html,base});
  if(!src)return '';
  try{const response=await page.request.get(src,{timeout:Math.min(timeoutMs,20000)});
    if(!response.ok())return '';
    const body=await response.body();return body.length>7_000_000?'':body.toString('utf8');
  }catch{return '';}
}
async function captureForCanonical(context,options){
  if(options.image){
    if(!/\.(png|jpe?g|webp)$/i.test(options.image))throw new Error('Screenshot must be PNG, JPG or WebP.');
    const buf=await readFile(options.image);
    if(buf.length>12*1024*1024)throw new Error('Screenshot exceeds the original 12 MB limit.');
    return {html:'',raw:'',css:'',bundle:'',host:'',imageBuffer:buf,mime:imageMime(options.image),coverage:{html:false,css:false,pixels:true}};}
  const page=await context.newPage();
  if(options.html){
    const localHtml=await readFile(options.html,'utf8');
    await page.setContent(localHtml,{waitUntil:'domcontentloaded',timeout:options.timeoutMs});
  }
  else await page.goto(options.url,{waitUntil:'domcontentloaded',timeout:options.timeoutMs});
  if(options.selector)await page.locator(options.selector).first().waitFor({state:'visible',timeout:options.timeoutMs});
  if(options.waitMs)await page.waitForTimeout(options.waitMs);
  const html=await page.content();
  const css=await readCss(page);
  const textLen=await page.evaluate(()=>document.body?.innerText?.trim().length||0);
  let imageBuffer=null;
  if(options.screenshot) imageBuffer=await page.screenshot({type:'png',timeout:options.timeoutMs});
  let bundle='';
  if(textLen<200)bundle=await readBundle(page,html,options.url||pathToFileURL(options.html).href,options.timeoutMs);
  await page.close();
  if(textLen<20&&!bundle)throw new Error('The target did not render readable content (possibly hydration failed). Refusing to report a misleading score. Use --ready-selector / --wait-ms.');
  const host=options.url?new URL(options.url).hostname.replace(/^www\./,''):'';
  return {html,raw:html,css,bundle,host,imageBuffer,mime:'image/png',
    coverage:{html:!!html,css:!!css,pixels:!!imageBuffer},
    warning:textLen<200?'Short rendered page; JS bundle fallback was attempted.':''};
}
async function runCanonical(context,options){
  // Fetch the engine before visiting the target; do not contact OpenRouter.
  const {page:enginePage,source}=await makeEngine(context,options);
  try{
    const captured=await captureForCanonical(context,options);
    const score=await inspectWithOriginalEngine(enginePage,captured);
    return {...score,capture:{mode:'canonical',source:source.origin,sha256:source.sha256,
      remoteFetch:false,note:options.engineHtml?'CONTRACT TEST ONLY: evaluator loaded from a mock HTML fixture, not the real slopcheck site.':'Uses the original deployed analyze()/score() functions; local capture may differ from the original Microlink/Jina capture.'},
      coverage:captured.coverage,warning:captured.warning,screenshotBuffer:captured.imageBuffer,
      screenshotKind:'target-page'};
  }finally{await enginePage.close();}
}
async function runLegacy(context,options){
  const captured=await captureForCanonical(context,options);
  const page=await context.newPage();
  const dataUrl=captured.imageBuffer?`data:${captured.mime};base64,${captured.imageBuffer.toString('base64')}`:null;
  const raw=await page.evaluate(inspectPage,{
    html:captured.html,css:captured.css,screenshotDataUrl:dataUrl,screenshotOnly:!!options.image,
  });
  await page.close();
  const calculated=calculateScore(raw);
  return {...calculated,coverage:raw.coverage,screenshotBuffer:captured.imageBuffer,
    capture:{mode:'legacy',source:'Bundled independent, approximate heuristics',remoteFetch:false,
      note:'WARNING: Not verified equivalent to the original slopcheck; score can differ.'},
    screenshotKind:'target-page',warning:'Approximate rules selected explicitly; this is NOT exact parity.'};
}

async function main(){
  const options=parseArgs(process.argv.slice(2));
  if(options.help){console.log(HELP);return;}
  const playwright=loadPlaywright();
  const browser=await playwright.chromium.launch({headless:true,...(options.browserPath?{executablePath:options.browserPath}:{}),
    ...(process.env.SLOP_AUDIT_NO_SANDBOX==='1'?{args:['--no-sandbox']}:{}),
  });
  let result;
  let comparison=null;
  try{
    const context=await browser.newContext({viewport:{width:1280,height:860},deviceScaleFactor:1,colorScheme:'light'});
    if(options.mode==='official')result=await runOfficial(context,options);
    else if(options.mode==='canonical')result=await runCanonical(context,options);
    else result=await runLegacy(context,options);
    if(options.compareOfficial){
      if(!options.image&&(!options.url||!isPublicUrl(options.url)))throw new Error('--compare-official requires a public --url or local --image input.');
      const official=await runOfficial(context,options);
      comparison=compareAudits(result,official)
    }
    await context.close();
  }finally{await browser.close();}
  const report={tool:'ai-slop-agent-audit',version:'2.0',checkedAt:new Date().toISOString(),
    target:options.url||options.image||options.html,mode:options.mode,
    ...Object.fromEntries(Object.entries(result).filter(([k])=>!['screenshotBuffer','screenshotKind'].includes(k))),
    ...(comparison?{comparison}:{}),
  };
  if(options.maxScore!==undefined)report.gate={threshold:options.maxScore,pass:report.score<=options.maxScore};
  const prefix=resolve(options.output);await mkdir(dirname(prefix),{recursive:true});
  await writeFile(prefix+'.json',JSON.stringify(report,null,2)+'\n');
  await writeFile(prefix+'.md',markdown(report));
  if(result.screenshotBuffer)await writeFile(prefix+'.png',result.screenshotBuffer);
  console.log(`AI Slop Agent Audit (${options.mode}): ${report.score}% — ${report.verdict}`);
  console.log(`${report.findings.length} findings, ${report.credits.length} credits`);
  for(const f of report.findings.slice(0,8))console.log(` +${f.points}: [${f.category}] ${f.label}`);
  if(comparison)console.log(`Original UI: ${comparison.officialScore}%, delta ${comparison.delta}; rules ${comparison.matchingRules?'match':'DIFFER'}, credits ${comparison.matchingCredits?'match':'DIFFER'} (${comparison.match?'MATCH':'MISMATCH'})`);
  console.log(`Reports: ${prefix}.json | .md${result.screenshotBuffer?' | .png':''}`);
  if(comparison&&!comparison.match)process.exitCode=3;
  else if(report.gate&&!report.gate.pass){console.log(`Score gate FAILED (${report.score} > ${report.gate.threshold})`);process.exitCode=2;}
}
main().catch(e=>{console.error(`Audit failed: ${e.stack||e.message}`);process.exitCode=1;});
