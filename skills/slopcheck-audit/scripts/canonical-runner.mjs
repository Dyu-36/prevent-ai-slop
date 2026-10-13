/** Execute the website's PUBLIC browser API rather than reimplementing its rules.
 * Nothing from the target website is posted to the slopcheck servers by this mode.
 * The canonical HTML is loaded into a new isolated browser page with its network
 * requests blocked before target data is evaluated.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extname, resolve} from 'node:path';

export const ORIGINAL_SITE = 'https://ai-slop-checker.vercel.app/';
const timeout = (ms) => AbortSignal.timeout(ms);

export async function loadEngineHtml(options) {
  let html;
  let origin;
  if (options.engineHtml) {
    html = await readFile(resolve(options.engineHtml), 'utf8');
    origin = `fixture:${resolve(options.engineHtml)}`;
  } else {
    origin = options.originalUrl || ORIGINAL_SITE;
    const resp = await fetch(origin, {
      signal: timeout(options.timeoutMs),
      headers: {'Accept':'text/html', 'User-Agent':'ai-slop-agent-audit (original-rule-runtime)'}
    }).catch(e => { throw new Error(`Cannot fetch the original rule engine at ${origin}: ${e.message}. No approximate score will be substituted. If needed, run --mode legacy explicitly.`); });
    if (!resp.ok) throw new Error(`Original rule engine returned HTTP ${resp.status} (${origin})`);
    html = await resp.text();
  }
  if (!html.includes('__slopcheck')) throw new Error(`The original site no longer exposes window.__slopcheck (${origin}). Audit stopped instead of silently using approximate rules.`);
  return {html, origin, sha256:createHash('sha256').update(html).digest('hex')};
}

/** Initialize the fetched, exact original analyze() and score() in an offline browser. */
export async function makeEngine(context, options) {
  const source = await loadEngineHtml(options);
  const enginePage = await context.newPage();
  // Isolate the third-party runtime and prevent network access during processing.
  await enginePage.route('**/*', r => r.abort('blockedbyclient'));
  const runtimeErrors = [];
  enginePage.on('pageerror', e => runtimeErrors.push(e.message));
  await enginePage.setContent(source.html, {waitUntil:'domcontentloaded', timeout: options.timeoutMs});
  const exported = await enginePage.evaluate(() => Boolean(window.__slopcheck &&
    typeof window.__slopcheck.analyze === 'function' &&
    typeof window.__slopcheck.score === 'function'));
  if (!exported) {
    await enginePage.close();
    throw new Error(`Original JS did not expose the expected analyze()/score() API. Runtime errors: ${runtimeErrors.slice(0,2).join(' | ') || 'none'}`);
  }
  return {page:enginePage, source};
}

export async function inspectWithOriginalEngine(enginePage, {html='',raw='',css='',bundle='',host='',imageBuffer=null,mime='image/png'}) {
  const screenshotDataUrl = imageBuffer ? `data:${mime};base64,${imageBuffer.toString('base64')}` : null;
  // Only JSON-friendly values cross into the isolated page. DOM parsing and pixel
  // analysis are performed by the original site's exported functions, not ours.
  const nativeResult = await enginePage.evaluate(async input => {
    let img = null;
    if (input.screenshotDataUrl) {
      img = new Image();
      img.src = input.screenshotDataUrl;
      await img.decode();
    }
    const analysis = window.__slopcheck.analyze({
      html:input.html, raw:input.raw, css:input.css,
      bundle:input.bundle, host:input.host, img,
    });
    const rated = window.__slopcheck.score(analysis);
    return {
      score:rated.score, verdict:rated.verdict,
      nativeFindings:rated.list, nativeCredits:rated.credits,
      cappedPoints:rated.pts, creditPoints:rated.minus,
      words:analysis.words, fromBundle:analysis.fromBundle,
    };
  }, {html,raw,css,bundle,host,screenshotDataUrl});
  return adaptNativeResult(nativeResult);
}

export function adaptNativeResult(n) {
  const toEvidence = q => typeof q === 'string' ? q : String(q?.note ?? '');
  const findings = (n.nativeFindings || []).map(f => ({
    category:f.cat, id:f.key, label:f.label,
    points:f.pts, roast:f.roast, why:f.why,
    evidence:(f.quotes || []).map(toEvidence),
  }));
  const credits = (n.nativeCredits || []).map(c => ({
    label:c.label, points:c.pts, why:c.detail, house:!!c.house,
  }));
  const byCategory = {};
  for (const f of findings) byCategory[f.category] = (byCategory[f.category] || 0) + f.points;
  return {
    score:n.score, verdict:n.verdict, findings, credits,
    totals:{cappedPoints:n.cappedPoints, creditPoints:n.creditPoints,
      effectivePoints:Math.max(0,n.cappedPoints+6-n.creditPoints), baselinePoints:6,
      byCategory, cappedByCategory:Object.fromEntries(Object.entries(byCategory).map(([key,val])=>
        [key, Math.min(({fingerprint:34, copy:40, layout:36, visual:18, nitpick:18})[key]??20, val)])),
    },
    details:{words:n.words, fromBundle:n.fromBundle},
  };
}

export function imageMime(path){
  const ext=extname(path).toLowerCase();
  if(ext==='.jpg'||ext==='.jpeg')return 'image/jpeg';
  if(ext==='.webp')return 'image/webp';
  return 'image/png';
}
