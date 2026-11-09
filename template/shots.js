// Screenshots for every demo in public/d/ → screenshots/<token>-desktop.jpg / -mobile.jpg
// Usage: node template/shots.js [--force]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), D = path.join(ROOT, 'public', 'd'), OUT = path.join(ROOT, 'screenshots');
const force = process.argv.includes('--force');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const toks = fs.readdirSync(D).filter((t) => force || !fs.existsSync(path.join(OUT, `${t}-mobile.jpg`)));
  const b = await chromium.launch();
  const ctxD = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const ctxM = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  // block the map iframe + fonts timing out offline shouldn't stall shots
  for (const c of [ctxD, ctxM]) await c.route(/google\.com\/maps/, (r) => r.abort());
  let n = 0;
  const work = async (t) => {
    for (const [ctx, kind] of [[ctxD, 'desktop'], [ctxM, 'mobile']]) {
      const p = await ctx.newPage();
      await p.goto('file://' + path.join(D, t, 'index.html'), { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await p.waitForTimeout(400);
      await p.screenshot({ path: path.join(OUT, `${t}-${kind}.jpg`), type: 'jpeg', quality: 68 });
      await p.close();
    }
    process.stdout.write(`\r${++n}/${toks.length}`);
  };
  for (let i = 0; i < toks.length; i += 4) await Promise.all(toks.slice(i, i + 4).map(work));
  await b.close();
  console.log(`\nScreenshots: ${n}`);
})();
