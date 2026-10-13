/** For PUBLIC URLs, run the actual deployed checker UI end to end.
 * This delegates all fetching, pixels, rules, credit caps, and scoring to the
 * website and reads the score rendered by that site. No copied rule logic.
 */
import {ORIGINAL_SITE} from './canonical-runner.mjs';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const decodeCategory = value => ({signature:'fingerprint',copy:'copy',
  'layout and code':'layout',visual:'visual',nitpick:'nitpick'})[value] || value;

export function isPublicUrl(value) {
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return false;
    const host = u.hostname.replace(/^\[|\]$/g,'').toLowerCase();
    if (!host.includes('.') || /\.(local|localhost|internal|test|invalid)$/.test(host)) return false;
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1') return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
    // IPv6 private or link local addresses.
    if (host.includes(':')) return false;
    return true;
  } catch {return false;}
}

export async function runOfficial(context, options) {
  const input = options.url || options.image;
  if (options.html) throw new Error('Official mode accepts only public --url or --image, not an HTML file.');
  if (options.url && !isPublicUrl(options.url)) throw new Error('Official mode cannot test localhost or a private host: Microlink/Jina cannot reach it. Use --mode canonical instead.');
  const page = await context.newPage();
  const officialUrl = options.originalUrl || ORIGINAL_SITE;
  if(options.officialHtml){
    const testHtml=await readFile(resolve(options.officialHtml),'utf8');
    await page.setContent(testHtml,{waitUntil:'domcontentloaded',timeout:options.timeoutMs});
  }else{
    await page.goto(officialUrl, {waitUntil:'domcontentloaded',timeout:options.timeoutMs});
  }
  await page.locator('#urlPanel, #shotPanel').first().waitFor({timeout:options.timeoutMs});
  if (options.url) {
    await page.locator('#url').fill(options.url);
    await page.locator('#go').click();
  } else {
    // Selecting the screenshot tab matches the input flow of the original site.
    await page.locator('#tabShot').click();
    await page.locator('#file').setInputFiles(options.image);
  }
  const deadline = Date.now() + options.resultTimeoutMs;
  let score = null;
  while (Date.now() < deadline) {
    const check = await page.evaluate(() => ({
      visible:!document.querySelector('#result')?.hidden,
      raw:document.querySelector('#rcTotal')?.textContent?.trim() || '',
      error:document.querySelector('#err')?.textContent?.trim() || '',
    }));
    if(check.visible && /^\d{1,3}%$/.test(check.raw)) {score=Number(check.raw.slice(0,-1));break;}
    if(check.error && !await page.locator('#go').isDisabled().catch(()=>false))
      throw new Error(`The original checker rejected this input: ${check.error}`);
    await page.waitForTimeout(300);
  }
  if(score===null) {
    const err=await page.locator('#err').textContent().catch(()=>null);
    throw new Error(`Original checker did not produce a score in ${options.resultTimeoutMs}ms${err ? ': '+err.trim() : ''}. No approximate score substituted.`);
  }
  // Read the official rendered evidence. The site's receipt only lists 8 major
  // findings, while the evidence section lists every detected pattern.
  const display = await page.evaluate(() => {
    const text = el => el?.textContent?.trim() || '';
    const receipt = [...document.querySelectorAll('#items > li')].filter(li =>
      !li.classList.contains('credit') && !li.classList.contains('muted') && !!li.querySelector('.n'))
      .map(li => ({label:text(li.querySelector('span')), points:parseInt(text(li.querySelector('.n')).replace(/[^0-9]/g,''),10) || 0}));
    const evidence = [...document.querySelectorAll('#ev > li')].map((li,i) => {
      const tag=text(li.querySelector('.tag'));
      const match=tag.match(/^(.+?)\s+\+(\d+)$/);
      return {category:match?.[1]?.trim() || 'unknown', points:Number(match?.[2] || 0),
        label:receipt[i]?.label || text(li.querySelector('h4')),
        roast:text(li.querySelector('h4')),why:text(li.querySelector('.why')),
        evidence:[...li.querySelectorAll('.quotes p')].map(text)};
    });
    const credits = [...document.querySelectorAll('#items > li.credit')].map(li=>({
      label:text(li.querySelector('span')),points:Number(text(li.querySelector('.n')).replace(/[^0-9]/g,''))||0,
    }));
    const descriptions=[...document.querySelectorAll('#good > li')].map(li=>text(li.querySelector('p')));
    const logs=[...document.querySelectorAll('#log > li')].map(li=>text(li));
    return {evidence,credits:credits.map((c,i)=>({...c,why:descriptions[i]||''})),logs,
      verdict:text(document.querySelector('#verdict')),
      receipt, name:text(document.querySelector('#rcName')),
      percent:text(document.querySelector('#rcTotal'))};
  });
  const findings=display.evidence.map((f,i)=>({...f,id:`official-${i+1}`,category:decodeCategory(f.category)}));
  let screenshotBuffer = null;
  try {screenshotBuffer=await page.locator('#result').screenshot({animations:'disabled',timeout:10000});} catch {}
  await page.close();
  return {
    score,verdict:display.verdict || '(Original AI commentary pending)',findings,
    credits:display.credits,
    totals:null, // The original interface does not expose the post-cap score breakdown.
    capture:{mode:'official',source:options.officialHtml?`fixture:${options.officialHtml}`:officialUrl,remoteFetch:!options.officialHtml,
      note:options.officialHtml?'CONTRACT TEST ONLY: score from a local mock interface, not the real site.':'The percentage is read directly from the original website UI.'},
    coverage:{html:!options.image,css:!options.image,
      pixels:!!options.image || display.logs.some(x=>/screenshot.*captured/i.test(x))},
    acquisitionLog:display.logs,
    screenshotBuffer,screenshotKind:'original-checker-result',
  };
}
