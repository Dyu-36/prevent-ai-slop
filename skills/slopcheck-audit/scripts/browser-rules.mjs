/**
 * Evaluates a rendered web page in the browser. No network calls are made here.
 * This is independently authored and tracks the published app's mechanical rule
 * categories/thresholds, without reproducing its jokes, output copy, or model calls.
 * This function is serialized and executed by Playwright's page.evaluate().
 */
export async function inspectPage({ html = '', css = '', screenshotDataUrl = null, screenshotOnly = false } = {}) {
  const findings = [];
  const credits = [];
  const add = (category, id, label, points, why, evidence = [], fix = '') =>
    findings.push({ category, id, label, points: Math.round(points), why, evidence: evidence.filter(Boolean).slice(0, 3).map(String), fix });
  const credit = (label, points, why) => credits.push({ label, points, why });
  const clip = (v, n = 160) => {
    const t = String(v ?? '').replace(/\s+/g, ' ').trim();
    return t.length <= n ? t : t.slice(0, n - 1).trim() + '…';
  };

  if (!screenshotOnly) {
    const raw = html;
    const lowerRaw = raw.toLowerCase();
    const doc = new DOMParser().parseFromString(html || document.documentElement.outerHTML, 'text/html');
    const metaAuthor = (doc.querySelector('meta[name="author"], meta[name="generator"]')?.getAttribute('content') || '').toLowerCase();
    const signatures = [
      ['Lovable', /id=["']lovable-badge|edit with lovable|lovable generated project|lovable-tagger|data-lov-id|gpteng\.co|\/lovable-uploads\//, /lovable/],
      ['v0', /data-v0-t|built with v0/, /\bv0\b/],
      ['Bolt', /bolt-preview|made with bolt/, /\bbolt\b/],
      ['AI app builder', /create\.xyz\/|same\.new\//, /create\.xyz|same/]
    ];
    const detected = signatures.find(([, htmlRx, authorRx]) => htmlRx.test(lowerRaw) || authorRx.test(metaAuthor));
    if (detected) add('fingerprint', 'gen', 'Builder signature', 30,
      'Mã trang còn dấu hiệu trực tiếp của công cụ sinh website.', [detected[0], clip(metaAuthor)], 'Bỏ metadata/badge mặc định chỉ khi đúng chủ đích; tập trung hoàn thiện sản phẩm.');
    const title = clip(doc.title, 100).toLowerCase();
    if (/^(vite \+ react( \+ ts)?|create next app|react app|my v0 project|lovable app|vite app|next\.js app)$/.test(title))
      add('fingerprint','title','Default page title',14,'Trang vẫn mang title mặc định của starter framework.', [`<title>${title}</title>`], 'Đặt title có tên sản phẩm và mô tả thực tế.');

    doc.querySelectorAll('script,style,noscript,template,iframe').forEach(el => el.remove());
    const textCache = new WeakMap();
    const textOf = (e) => {
      if (!e) return '';
      if (textCache.has(e)) return textCache.get(e);
      const walker = doc.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      const arr = []; let node;
      while ((node = walker.nextNode())) arr.push(node.nodeValue);
      const txt = arr.join(' ').replace(/\s+/g,' ').replace(/\s([,.!?:;])/g, '$1').trim();
      textCache.set(e,txt);
      return txt;
    };
    const klass = (e) => e?.getAttribute('class') || '';
    const els = [...doc.body.querySelectorAll('*')];
    const bodyText = textOf(doc.body);
    const low = bodyText.toLowerCase();
    const words = bodyText ? bodyText.split(' ').length : 0;
    const heads = [...doc.querySelectorAll('h1,h2,h3')].filter(e => textOf(e).length > 1);
    const h1 = doc.querySelector('h1') || doc.querySelector('h2');
    const h1Text = clip(textOf(h1), 110);
    const leaves = els.filter(e => !e.children.length).map(textOf).filter(t=>t.length>20);
    const around = (rx) => {
      for(const t of leaves) {const m=t.match(rx);if(m){const i=m.index;return clip(t.slice(Math.max(0,i-70),Math.min(t.length,i+m[0].length+70)),130);}}
      const m=bodyText.match(rx);return m?clip(bodyText.slice(Math.max(0,m.index-70),m.index+m[0].length+70),130):'';
    };

    // Copy: first-line clichés, stock section labels, generic CTAs and linguistic habits.
    const heroRules = [
      /^(discover|unlock|elevate|transform|empower|supercharge|revolutioni[sz]e|reimagine|experience|unleash|welcome to|introducing|meet the future)\b/i,
      /\byour\s+[a-z]+,\s*our\s+[a-z]+/i,
      /\b(the future of|next[- ]generation|all[- ]in[- ]one|made (simple|easy|effortless)|at your fingertips|like never before|one platform|seamless(ly)?|effortless(ly)?|10x|ai[- ]powered|powered by ai)\b/i,
      /\b(find the perfect|we create solutions|solutions for your business|build your dream|to the next level|grow your business|everything you need|redefin(e|ing)|elevate your|your journey)\b/i
    ];
    if(h1Text && heroRules.some(r=>r.test(h1Text))) add('copy','hero','Generic hero headline',13,'Hero hứa hẹn chung chung, khó nhận ra sản phẩm dành cho ai.',[h1Text],'Nêu rõ sản phẩm, đối tượng và giá trị khác biệt ngay ở H1.');

    const buzzTerms = ['unlock','unleash','elevate','empower','supercharge','seamless','effortless','revolutioni','game-chang','cutting-edge','state-of-the-art','next-level','leverage','streamline','robust','innovative','comprehensive','tailored','holistic','synergy','world-class','best-in-class','transform your','take your','boost your','skyrocket','harness','unparalleled','delve','ever-evolving','fast-paced','in today’s',"in today's",'peace of mind','top-notch','exceptional','look no further','dive into','empowering','one-stop','hassle-free','stunning','all-in-one','next generation','like never before','at your fingertips','reimagin'];
    const buzz = buzzTerms.map(t=>[t,low.split(t).length-1]).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
    const buzzCount=buzz.reduce((s,[,n])=>s+n,0), density=words?buzzCount/words*1000:0;
    if(buzzCount>=3 && density>=4) add('copy','buzz','Marketing filler',Math.min(16,4+density*1.2),`${buzzCount} từ quảng cáo chung chung trong ${words} từ nội dung.`,buzz.slice(0,2).map(([x])=>around(new RegExp(x.replace(/[-]/g,'\\-'),'i'))),'Thay tính từ chung chung bằng tính năng thực tế, số liệu hoặc ví dụ.');
    else if(words>150 && density<1.5) credit('No filler words',6,`Chỉ ${buzzCount} dấu hiệu filler trong ${words} từ.`);

    const sectionNames = [
      /^(our )?services$/, /^why choose\b/, /^what (our )?(clients|customers|users|people|students|members) (say|are saying)/, /^how it works$/, /^(our |key |powerful |amazing )?features$/, /^testimonials$/, /^ready to (get started|transform|take|start|join|elevate|boost|begin|experience)/,
      /^get in touch$/, /^(contact us|about us)$/, /^meet (our|the) (team|experts)/, /^(our )?mission$/, /^join (thousands|our community|the)/, /^trusted by/, /^(simple|transparent|simple, transparent|flexible) pricing/, /^we provide the best/,
      /^our (story|values|process|clients|partners|team|work)$/, /^(everything|all) you need/, /^(choose|pick|find) (the|your) (right |perfect )?plan/, /^start your .{0,30} today/,
      /^(join|subscribe to) our newsletter/, /^why us\??$/, /^stay (updated|in the loop)/, /^(get|let’s get|let's get) started/
    ];
    const templateHeadings=heads.slice(1).map(textOf).filter(t=>t.length<60 && sectionNames.some(r=>r.test(t.toLowerCase().replace(/[?!.]+$/,''))));
    if(templateHeadings.length>=2) add('copy','sections','Template section names',Math.min(15,templateHeadings.length*3.5),'Nhiều tiêu đề section chung chung.',templateHeadings,'Đổi tiêu đề section thành nội dung cụ thể, có ích cho người đọc.');

    const stats=[];
    for(const e of els) {
      if(e.children.length)continue;
      const t=textOf(e);
      if(/^[$€£]?\d[\d,.]*\s?(k|m|b)?\s?(\+|%)$|^\d+\/7$|^\d+(k|m)\+?$/i.test(t)){
        const label=textOf(e.nextElementSibling||e.parentElement?.nextElementSibling);
        stats.push(clip(t+(label&&label.length<40?' '+label:''),40));
      }
    }
    if(stats.length>=3 && stats.filter(t=>/\+/.test(t)).length>=2) add('copy','stats','Unverified rounded-number stats',Math.min(10,5+stats.length),'Dãy số liệu tròn có dấu + trông như placeholder.',[stats.slice(0,4).join(' | ')],'Ghi nguồn, thời gian đo và ý nghĩa của số liệu.');
    const stars=(bodyText.match(/★/g)||[]).length+doc.querySelectorAll('svg[class*="star"], [class*="lucide-star"]').length;
    if(stars>=5) add('copy','testimonials','Five-star testimonial pattern',9,'Trang có nhiều biểu tượng sao thường dùng trong testimonial mẫu.',[`${stars} star symbols/icons`],'Chỉ hiển thị nhận xét xác thực, có nguồn nếu được phép.');
    const emojis=[];
    for(const e of els) {if(e.children.length>1)continue;const t=textOf(e);if(t&&t.length<70){const m=t.match(/^\s*(\p{Extended_Pictographic})/u);if(m&&!/[©®™❤]/.test(m[1])) emojis.push(m[1]);}}
    if(emojis.length>=3) add('copy','emoji','Emoji used as UI icons',Math.min(10,4+emojis.length),'Emoji đang thay icon trong các khối nội dung.',[...new Set(emojis)].slice(0,8),'Chọn bộ icon thống nhất nếu cần icon; tránh emoji trang trí hàng loạt.');
    const prose=els.filter(e=>!e.children.length && textOf(e).length>50).map(textOf).join(' ');
    const emDashes=(prose.match(/\u2014/g)||[]).length;
    if(emDashes>=3 && (emDashes/Math.max(words,1))*1000>=5) add('copy','dash','Frequent em dash',Math.min(12,4+emDashes),'Lạm dụng dấu gạch dài trong văn bản quảng cáo.',[around(/\u2014/)],'Viết câu tự nhiên và ngắn gọn; không cần xoá tất cả dấu gạch dài.');
    const notJust=around(/\b(?:not just|isn['’]t just|more than just)\b/i);
    if(notJust) add('copy','notjust','Not-just-X slogan',6,'Mẫu câu quảng cáo “not just X”.',[notJust],'Nêu lợi ích cụ thể thay vì đối lập sáo rỗng.');
    const beat=bodyText.match(/\b[A-Z][a-z]{2,9}\. [A-Z][a-z]{2,9}\. [A-Z][a-z]{2,9}\./);
    if(beat) add('copy','beat','Three-beat slogan',7,'Khẩu hiệu ba từ/tổ hợp ngắn đứng liên tiếp.',[beat[0]],'Dùng câu tự nhiên mô tả đúng giá trị.');
    const nav=[...doc.querySelectorAll('nav a,header a,nav button,header button')].map(textOf).map(t=>t.toLowerCase());
    if(nav.includes('home') && nav.filter(t=>/^(about|about us|services|contact|contact us|testimonials)$/.test(t)).length>=2)
      add('copy','nav','Template navigation',6,'Menu điều hướng trùng template thông dụng.',[nav.slice(0,6).join(' | ')],'Đặt menu dựa vào nhu cầu điều hướng thực tế.');
    const buttons=[...doc.querySelectorAll('a,button')].map(textOf).map(t=>t.toLowerCase());
    if(buttons.some(t=>/^get started/.test(t)) && buttons.some(t=>/^learn more/.test(t)))
      add('copy','ctas','Default CTA buttons',5,'Cặp “Get Started” và “Learn More” không nêu hành động cụ thể.',['Get Started | Learn More'],'Dùng CTA mô tả rõ kết quả hành động, ví dụ “Create project”.');

    // Layout / code signals.
    const boldHeads=heads.filter(e=>/\bfont-(bold|extrabold|black)\b/.test(klass(e))||/font-weight:\s*(7|8|9)00/.test(e.getAttribute('style')||''));
    const classedHeads=heads.filter(e=>klass(e));
    if(h1 && boldHeads.includes(h1) && classedHeads.length && boldHeads.length/classedHeads.length>0.5)
      add('layout','bold','Bold headings everywhere',8,'Đa số heading dùng font-weight nặng.',[`${boldHeads.length}/${classedHeads.length} headings`],'Dùng tỷ lệ cấp bậc kiểu chữ thay vì tô đậm tất cả.');
    if(h1 && /\bfont-(thin|extralight|light|normal)\b/.test(klass(h1))) credit('Light display type',4,'H1 dùng trọng lượng chữ nhẹ.');
    const gradient=els.filter(e=>/bg-clip-text|background-clip:\s*text/.test(klass(e)+(e.getAttribute('style')||'')) && textOf(e));
    if(gradient.length) add('layout','gtext','Gradient text',Math.min(14,9+gradient.length*1.5),'Gradient text xuất hiện trong headline.',gradient.slice(0,2).map(e=>clip(textOf(e),80)),'Dùng màu chữ đơn sắc hoặc giới hạn gradient nếu có ý nghĩa thương hiệu.');
    const orbs=els.filter(e=>/\bblur-(2xl|3xl|\[\d{2,}px\])/.test(klass(e)) && /\b(absolute|fixed)\b/.test(klass(e)) && /\brounded-full\b/.test(klass(e)) && /\b(bg|from)-[a-z]+-\d00/.test(klass(e)));
    if(orbs.length) add('layout','orbs','Glowing background orbs',Math.min(12,6+orbs.length*2),'Các blob mờ trang trí phía sau giao diện.',[`${orbs.length} orb(s)`,clip(klass(orbs[0]),100)],'Thay hình nền vô nghĩa bằng visual hỗ trợ nội dung hoặc giảm độ trang trí.');
    if(h1) {
      let badge='';let n=h1;
      for(let u=0;u<3 && n && !badge;u++,n=n.parentElement){
        let s=n.previousElementSibling;
        for(let k=0;k<2 && s && !badge;k++,s=s.previousElementSibling){
          const p=/\brounded-full\b/.test(klass(s))?s:s.querySelector?.('[class*="rounded-full"]');
          const t=textOf(p);if(p&&t.length>2&&t.length<60)badge=t;
        }
      }
      if(badge)add('layout','badge','Announcement pill above headline',8,'Nhãn bo tròn nằm phía trên headline theo pattern phổ biến.',[badge],'Chỉ giữ khi badge thông báo một sự kiện hữu ích.');
    }
    let grids=0,gridEvidence='';
    for(const g of els){
      if(!/\bgrid-cols-(3|4)\b|:grid-cols-(3|4)\b/.test(klass(g))||g.children.length<3||g.children.length>12)continue;
      const cards=[...g.children].filter(c=> (c.querySelector('svg')||/^\s*\p{Extended_Pictographic}/u.test(textOf(c))) && c.querySelector('h3,h4,h5')&&c.querySelector('p'));
      if(cards.length>=3&&!cards.some(c=>/[$€£₹]\s?\d|\/\s?mo\b|per month/i.test(textOf(c)))){grids++;if(!gridEvidence)gridEvidence=cards.slice(0,4).map(c=>textOf(c.querySelector('h3,h4,h5'))).join(' | ');}
    }
    if(grids) add('layout','cards','Identical icon-card grids',Math.min(14,6+grids*3),'Dãy card cùng khuôn “icon + title + short blurb”.',[gridEvidence],'Đổi sang cách trình bày phù hợp tính năng thực tế, demo hoặc ví dụ có dữ liệu.');
    const sourceImgs=[...doc.querySelectorAll('img[src],img[srcset],[style*="background"]')].map(e=>(e.getAttribute('src')||'')+' '+(e.getAttribute('srcset')||'')+' '+(e.getAttribute('style')||''));
    const stockRx=/images\.unsplash\.com|plus\.unsplash\.com|source\.unsplash\.com|images\.pexels\.com|cdn\.pixabay\.com|placeholder\.svg|via\.placeholder\.com|placehold\.(co|it)|picsum\.photos|randomuser\.me|i\.pravatar\.cc|ui-avatars\.com|dummyimage\.com|loremflickr/;
    const stockImgs=sourceImgs.filter(s=>stockRx.test(s));
    if(stockImgs.length)add('layout','stock','Stock or placeholder images',Math.min(18,9+stockImgs.length*1.5),'Có ảnh lấy từ thư viện stock hoặc placeholder.',stockImgs.slice(0,2).map(s=>clip(s,120)),'Dùng ảnh thật của sản phẩm hoặc minh hoạ được thiết kế cho bài toán.');
    else{
      const customImgs=sourceImgs.filter(s=>/\.(jpe?g|png|webp|avif)|_next\/image|framerusercontent|imgix|cloudinary/.test(s)&&!/icon|logo|avatar|favicon/.test(s));
      if(customImgs.length>=2)credit('Non-stock imagery',4,`${customImgs.length} ảnh không trùng danh sách nguồn stock mẫu.`);
    }
    const palette=[...doc.querySelectorAll('a,button')].map(klass).map(c=>c.match(/\b(?:bg|from)-(blue|indigo|purple|violet|green|emerald|teal|cyan|sky|orange|amber|pink|rose|red|lime|fuchsia|yellow)-(400|500|600|700)\b/)?.[0]).filter(Boolean);
    if(palette.length>=2)add('layout','palette','Default Tailwind button colors',Math.min(9,4+palette.length),'Màu nút gợi màu mẫu Tailwind.',[...new Set(palette)].slice(0,3),'Đặt color token riêng cho thương hiệu.');
    const lucide=doc.querySelectorAll('svg[class*="lucide"]');
    if(lucide.length>=12)add('layout','lucide','Too many Lucide icons',Math.min(7,3+lucide.length/8),'Icon Lucide xuất hiện dày đặc.',[`${lucide.length} icons`],'Giảm icon không mang ý nghĩa; không bắt buộc bỏ Lucide.');
    const cssAll=css+'\n'+raw;
    const shadcnTokens=['222.2 84% 4.9%','222.2 47.4% 11.2%','215.4 16.3% 46.9%','214.3 31.8% 91.4%','oklch(0.145 0 0)','oklch(0.205 0 0)','oklch(0.556 0 0)','oklch(0.922 0 0)'].filter(v=>cssAll.includes(v));
    if(shadcnTokens.length>=2)add('layout','shadcn','Untouched shadcn theme',11,'Các token màu vẫn giống mặc định shadcn.',shadcnTokens.slice(0,3),'Chọn bộ màu của sản phẩm thay vì giữ nguyên theme mẫu.');
    const families=new Set();
    for(const m of cssAll.matchAll(/font-family\s*:\s*([^;}{]+)/gi))m[1].split(',').forEach(f=>families.add(f.replace(/["'()!]|important/g,'').trim().toLowerCase()));
    for(const m of raw.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)){
      try{decodeURIComponent(m[1]).split('|').forEach(f=>families.add(f.split(':')[0].replace(/\+/g,' ').toLowerCase()));}catch{}
    }
    const usual=new Set('inter|inter var|inter tight|geist|geist sans|geist mono|poppins|roboto|open sans|montserrat|lato|plus jakarta sans|dm sans|manrope|nunito|raleway|playfair display|space grotesk|outfit|system-ui|sans-serif|serif|monospace|arial|helvetica|helvetica neue|-apple-system|blinkmacsystemfont|segoe ui|ui-sans-serif|ui-serif|ui-monospace|apple color emoji|segoe ui emoji|segoe ui symbol|noto color emoji|noto sans|times|times new roman|georgia|menlo|monaco|consolas|courier|courier new|sf mono|sfmono-regular|liberation mono|cambria|inherit|initial|emoji|math|fangsong|cursive'.split('|'));
    const normalized=f=>f.replace(/[\s_-]+/g,'');
    const usualNorm=new Set([...usual].map(normalized));
    const real=[...families].filter(f=>f&&f.length<40&&!f.startsWith('var(')&&!f.startsWith('__')&&!/fallback|icon|awesome|symbols|katex|mathjax/.test(f));
    const custom=real.filter(f=>!usual.has(f)&&!usualNorm.has(normalized(f))&&!/^(geist|inter)/.test(normalized(f)));
    if(custom.length)credit('Chosen typeface',6,`Font riêng: ${custom.slice(0,2).join(', ')}`);
    else{const found=real.find(f=>/^(inter|poppins|montserrat|plus jakarta sans|dm sans|roboto|open sans|playfair display)$/.test(f));
      if(found)add('layout','font','Common default font',4,'Font thông dụng có thể tạo cảm giác template.',[found],'Dùng font phù hợp nhận diện; không cần thay nếu đã đúng brand.');}

    // Low severity nitpicks, included to track the original score behavior.
    const nit=(id,label,pts,why,evidence=[],fix='')=>{if(!findings.some(f=>f.id===id))add('nitpick',id,label,pts,why,evidence,fix);};
    if(/\/_next\//.test(lowerRaw))nit('next','Next.js fingerprint',3,'Trang có đường dẫn asset Next.js.',['/_next/'],'Không cần đổi framework chỉ để đạt điểm thấp.');
    if([...families].some(f=>/^geist/.test(f.replace(/\s/g,''))))nit('geist','Geist font',3,'Dùng Geist, font mặc định quen thuộc.', ['Geist'],'Không cần sửa nếu nhận diện phù hợp.');
    const toggle=[...doc.querySelectorAll('button,[role="switch"]')].find(b=>/theme|dark|light mode/i.test((b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||'')+' '+textOf(b)));
    if(toggle)nit('toggle','Theme toggle',3,'Có nút đổi giao diện tối/sáng.',[clip(textOf(toggle)||toggle.getAttribute('aria-label'))],'Giữ nếu thực sự hoạt động và hữu ích.');
    if(/\bcontributions?\b/i.test(bodyText))nit('contrib','Contribution graph',4,'Dấu hiệu portfolio có bảng GitHub contributions.',[around(/contributions?/i)],'Ưu tiên mô tả tác động dự án hơn số commit.');
    const stack=heads.map(textOf).find(t=>/^(tech(nology)? stack|my stack|stack|tools i use|technologies|skills|tools & technologies)$/i.test(t));
    if(stack)nit('stack','Tech stack wall',4,'Section chỉ liệt kê công nghệ.',[stack],'Nêu dự án và quyết định kỹ thuật có tác động.');
    const bio=around(/\b(obsess(ing|ed)? over (the )?(small |little )?details|pixel[- ]perfect|passionate about|i love building|crafting (beautiful|delightful|digital)|turning ideas into|tinkerer|i build (things|products|stuff) for the web)\b/i);
    if(bio)nit('bio','Generic portfolio bio',4,'Câu giới thiệu nhà phát triển kiểu mẫu.',[bio],'Viết thành tựu hay lĩnh vực chuyên môn cụ thể.');
    const aiPower=around(/\bai[- ]powered\b/i);
    if(aiPower&&!findings.some(f=>f.id==='hero'))nit('aipow','AI-powered phrase',3,'“AI-powered” đứng một mình ít thông tin.',[aiPower],'Nêu khả năng AI thực sự làm được.');
    const prompt=[...doc.querySelectorAll('textarea[placeholder],input[placeholder]')].map(el=>el.getAttribute('placeholder')).find(t=>/describe|what do you want|what are you|ask (me )?anything|build|prompt|imagine|idea/i.test(t));
    if(prompt)nit('prompt','Prompt box as hero',4,'Ô prompt nằm tại hero của sản phẩm AI.',[prompt],'Giữ khi ô prompt là chức năng sản phẩm.');
    const col=els.filter(e=>/\bmx-auto\b/.test(klass(e))&&/\bmax-w-(xl|2xl|3xl|prose)\b/.test(klass(e)));
    if(col.length>=2)nit('column','Centered narrow column',3,'Bố cục single-column dễ gặp ở portfolio.',[`${col.length} centered narrow elements`],'Chỉ đổi khi bố cục gây thiếu phân cấp hoặc khó đọc.');
    const rounds=els.filter(e=>/\brounded-(xl|2xl|3xl)\b/.test(klass(e))).length;
    if(rounds>=8&&!findings.some(f=>f.id==='cards'))nit('round','Over-rounded surfaces',3,'Bo tròn nhiều thành phần.',[`${rounds} rounded elements`],'Thống nhất bán kính theo design system.');
    const glasses=els.filter(e=>/\bbackdrop-blur/.test(klass(e))).length;
    if(glasses>=2)nit('glass','Multiple frosted panels',3,'Backdrop blur được dùng ở nhiều thành phần.',[`${glasses} backdrop-blur elements`],'Chỉ dùng nơi hỗ trợ đọc hoặc phân lớp.');
    const fades=els.filter(e=>/opacity:\s*0[;\s]/.test(e.getAttribute('style')||'')&&/transform|translate/.test(e.getAttribute('style')||'')).length;
    if(fades>=3)nit('fade','Fade-up animations',3,'Nhiều thành phần khởi đầu invisible và chuyển động.',[`${fades} elements`],'Giảm animation lặp lại không phục vụ thông tin.');
    if(lucide.length>=3&&lucide.length<12)nit('lucidelite','Lucide usage',2,'Trang sử dụng bộ icon Lucide.',[`${lucide.length} icons`],'Không cần sửa nếu icon có mục đích.');
    if(doc.querySelector('[data-slot]')&&!findings.some(f=>f.id==='shadcn'))nit('shadcnlite','shadcn component attributes',3,'Phát hiện thuộc tính data-slot của shadcn.',['data-slot'],'Không phải lỗi chức năng.');
    const allDashes=(bodyText.match(/\u2014/g)||[]).length;
    if(allDashes&&!findings.some(f=>f.id==='dash'))nit('dashlite','Em dash usage',2,'Có dấu gạch dài trong nội dung.',[around(/\u2014/)],'Không phải lỗi; chỉ sửa nếu văn bản lặp mẫu.');
    const allEmoji=(bodyText.match(/\p{Extended_Pictographic}/gu)||[]).filter(x=>!/[©®™❤]/.test(x));
    if(allEmoji.length&&!findings.some(f=>f.id==='emoji'))nit('emojilite','Emoji usage',2,'Trang sử dụng emoji.',[allEmoji[0]],'Dùng emoji phù hợp ngữ cảnh; không tự động loại bỏ.');
  }

  // Screenshot-based visual inspection (3 original hue/brightness heuristics).
  if(screenshotDataUrl){
    const img = new Image();img.src=screenshotDataUrl;
    try{
      await img.decode();
      const W=200, srcH=Math.min(img.naturalHeight,img.naturalWidth*0.68);
      const H=Math.max(1,Math.round(W*srcH/img.naturalWidth));
      const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0,img.naturalWidth,srcH,0,0,W,H);
      const pixels=ctx.getImageData(0,0,W,H).data;let sat=0,violet=0,lime=0,neon=0,dark=0;
      function hsl(red,green,blue){
        const r=red/255,g=green/255,b=blue/255,max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
        if(max===min)return[0,0,l];
        const d=max-min,s=l>0.5?d/(2-max-min):d/(max+min);
        const h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60;
        return[h,s,l];
      }
      for(let p=0;p<pixels.length;p+=4){
        const [h,s,l]=hsl(pixels[p],pixels[p+1],pixels[p+2]);
        if(l<0.16)dark++;
        if(s>0.35&&l>0.2&&l<0.85){sat++;if(h>=235&&h<=300)violet++;}
        if(h>=72&&h<=100&&s>0.6&&l>0.42&&l<0.72)lime++;
        if(s>0.75&&l>0.42&&l<0.72)neon++;
      }
      const total=W*H;
      if(sat/total>0.015&&violet/sat>0.4) add('visual','purple','Purple / indigo accent',Math.min(16,6+violet/sat*12),'Màu tím/indigo chiếm phần lớn số pixel bão hoà màu.',[`${Math.round(violet/sat*100)}% of saturated pixels are purple/indigo`],'Giữ nếu đúng brand; nếu không, chọn bảng màu có chủ đích.');
      if(lime/total>0.002&&lime/total<0.2)add('visual','lime','Acid lime accent',7,'Xanh lime nổi bật trên giao diện.',[`${(lime/total*100).toFixed(1)}% pixels`],'Chọn accent dựa trên nhận diện sản phẩm, không theo xu hướng.');
      if(dark/total>0.5&&neon/total>0.006)add('visual','darkneon','Dark + neon pattern',7,'Nền tối đi kèm màu neon bão hoà.',[`${Math.round(dark/total*100)}% dark; ${(neon/total*100).toFixed(1)}% neon`],'Cân nhắc tương phản, phân cấp và đặc trưng thương hiệu.');
    }catch(e){
      return {findings,credits,coverage:{html:!screenshotOnly,css:!!css,pixels:false},warning:`Cannot decode screenshot: ${String(e.message||e)}`};
    }
  }
  return { findings, credits, coverage: {html:!screenshotOnly,css:!!css,pixels:!!screenshotDataUrl} };
}
