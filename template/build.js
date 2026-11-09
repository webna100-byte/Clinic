#!/usr/bin/env node
/*
 Bytevia demo generator — one template, niche presets, bilingual + RTL.

 Build ONE demo:
   node template/build.js --name "Smile Studio" --niche clinic --city Dubai --lang ar \
        [--color "#0E7C86"] [--whatsapp +971501234567] [--instagram https://instagram.com/x] \
        [--logo https://.../logo.png | ./path/logo.png] [--maps "Smile Studio Dubai"]

 Build ALL demos from the leads sheet (adds tokens + demo URLs back into leads.csv):
   node template/build.js --all [--limit 50]

 Output: public/d/<token>/index.html (+ public/d/<token>/<lang2>/index.html)
 Base URL for links: env DEMO_BASE_URL or template/config.json { "baseUrl": "https://xxx.pages.dev" }
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { ui, niches, langPair } = require('./presets');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'd');
const TOKENS = path.join(ROOT, 'data', 'tokens.json');
const CONFIG = path.join(__dirname, 'config.json');

const cfg = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};
const BASE = (process.env.DEMO_BASE_URL || cfg.baseUrl || '').replace(/\/$/, '');

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const keyOf = (r) => (r.name + '|' + r.city).toLowerCase().replace(/\s+/g, ' ').trim();

function loadTokens() { try { return JSON.parse(fs.readFileSync(TOKENS, 'utf8')); } catch { return {}; } }
function saveTokens(t) { fs.mkdirSync(path.dirname(TOKENS), { recursive: true }); fs.writeFileSync(TOKENS, JSON.stringify(t, null, 1)); }
function tokenFor(r, tokens) {
  const k = keyOf(r);
  if (!tokens[k]) {
    const slug = r.name.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_]+/g, '-').slice(0, 24).replace(/-+$/, '');
    tokens[k] = (slug ? slug + '-' : '') + crypto.randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, 'x');
  }
  return tokens[k];
}

function initials(name) {
  const words = name.replace(/[^\p{L}\p{N}\s&]/gu, ' ').split(/\s+/).filter((w) => w && !/^(the|and|&|al|el|de|der|die|das|van|la|le|llc|l\.l\.c|fze|gmbh|ag|bv|ab|as)$/i.test(w));
  const ini = (words[0]?.[0] || name[0] || 'B') + (words[1]?.[0] || '');
  return ini.toUpperCase();
}
function monogram(name, color) {
  return `<svg class="logo" viewBox="0 0 48 48" width="44" height="44" role="img" aria-label="${esc(name)}"><rect width="48" height="48" rx="12" fill="${esc(color)}"/><text x="24" y="31" text-anchor="middle" font-family="Poppins,Cairo,sans-serif" font-size="19" font-weight="700" fill="#fff">${esc(initials(name))}</text></svg>`;
}

function fetchLogo(src, dir) {
  if (!src) return null;
  try {
    if (!/^https?:/i.test(src)) {
      const p = path.resolve(src); if (!fs.existsSync(p)) return null;
      const ext = (path.extname(p) || '.png').toLowerCase(); fs.copyFileSync(p, path.join(dir, 'logo' + ext)); return 'logo' + ext;
    }
    const tmp = path.join(dir, 'logo.tmp');
    execFileSync('curl', ['-sL', '-m', '20', '-A', 'Mozilla/5.0', '-o', tmp, src], { stdio: 'ignore' });
    const buf = fs.readFileSync(tmp);
    let ext = null;
    if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') ext = '.png';
    else if (buf[0] === 0xff && buf[1] === 0xd8) ext = '.jpg';
    else if (buf.slice(0, 4).toString() === 'RIFF') ext = '.webp';
    else if (/<svg/i.test(buf.slice(0, 500).toString())) ext = '.svg';
    else if (buf.slice(0, 4).toString('hex') === '00000100') ext = '.ico';
    if (!ext || buf.length < 200) { fs.unlinkSync(tmp); return null; }
    fs.renameSync(tmp, path.join(dir, 'logo' + ext));
    return 'logo' + ext;
  } catch { return null; }
}

// ---------- icons ----------
const I = {
  tooth: '<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.4 2.5 1 6 2.5 6s1.8-3.5 2.5-5.5c.3-.8 1.7-.8 2 0 .7 2 1 5.5 2.5 5.5s2.1-3.5 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
  scale: '<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0L6 7zm12 0-3 7a3 3 0 0 0 6 0l-3-7z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>',
  house: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  cup: '<path d="M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8zm13 1h1.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2M15 3v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
};
const svg = (k, fillIt) => `<svg viewBox="0 0 24 24" fill="${fillIt ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${fillIt ? 0 : 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
const WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/></svg>';

// ---------- render ----------
function render(d, lang, otherLang, depth) {
  const t = ui[lang], n = niches[d.niche], c = n.copy[lang];
  const v = { name: d.name, city: d.cityLocal?.[lang] || d.city };
  const up = '../'.repeat(depth);
  const assets = up + '../../assets';
  const img = (i) => `${assets}/img/${n.images[i % n.images.length]}.jpg`;
  const waNum = (d.whatsapp || '').replace(/[^\d]/g, '');
  const waLink = waNum ? `https://wa.me/${waNum}` : '';
  const igLink = d.instagram || '';
  const chat = waLink || igLink || '#contact';
  const mapsQ = encodeURIComponent(d.maps || `${d.name} ${d.city}`);
  const logo = d.logoFile ? `<img class="logo" src="${up}${d.logoFile}" alt="${esc(d.name)}">` : monogram(d.name, d.color);
  const otherHref = depth ? '../' : `${otherLang}/`;
  const sections = ['services', 'about', 'gallery', 'reviews', 'contact'];
  const rv = ['A.K.', 'S.M.', 'R.H.'];

  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.name)} — ${esc(c.svcT)}</title>
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="${esc(fill(c.heroS, v))}">
<link rel="stylesheet" href="${assets}/site.css">
<style>:root{--brand:${esc(d.color)}}</style>
</head>
<body>
<div class="top">
<div class="concept"><img src="${assets}/bytevia.png" alt="">${esc(fill(t.bar, v))}</div>
<header class="site"><div class="wrap nav">
  <a class="brand" href="#top">${logo}<span>${esc(d.name)}</span></a>
  <nav class="menu">${t.nav.map((x, i) => `<a href="#${sections[i]}">${esc(x)}</a>`).join('')}</nav>
  <div class="tools"><a class="lang" href="${otherHref}">${esc(ui[otherLang].label)}</a><a class="btn sm" href="#contact">${esc(c.cta)}</a></div>
</div></header>
</div>

<main id="top">
<section class="hero"><div class="bg" style="background-image:url('${img(0)}')"></div><div class="wrap">
  <span class="kicker">${esc(d.name)} · ${esc(v.city)}</span>
  <h1>${esc(fill(c.heroT, v))}</h1>
  <p>${esc(fill(c.heroS, v))}</p>
  <div class="ctas"><a class="btn" href="#contact">${esc(c.cta)}</a>${waLink ? `<a class="btn ghost" href="${waLink}" target="_blank" rel="noopener">${esc(t.whatsapp)}</a>` : ''}</div>
  <div class="trust">${t.why.map((w) => `<div>${svg('check')}${esc(w)}</div>`).join('')}</div>
</div></section>

<section id="services"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(t.nav[0])}</span><h2>${esc(c.svcT)}</h2></div>
  <div class="grid g4">${c.svc.map(([a, b]) => `<div class="card"><div class="ic">${svg(n.icon)}</div><h3>${esc(a)}</h3><p>${esc(b)}</p></div>`).join('')}</div>
</div></section>

<section id="about" class="soft"><div class="wrap grid g2 about">
  <div class="img" style="background-image:url('${img(1)}')"></div>
  <div><span class="eyebrow">${esc(t.about)}</span><h2>${esc(d.name)}</h2><p>${esc(fill(c.aboutX, v))}</p>
  <h3 style="margin-top:22px">${esc(t.team)}</h3><p style="color:var(--muted)">${esc(t.teamText)}</p>
  <ul>${t.why.map((w) => `<li>${svg('check')}${esc(w)}</li>`).join('')}</ul></div>
</div></section>

<section class="special"><div class="wrap">
  <div class="head"><h2>${esc(c.spT)}</h2></div>
  <div class="grid g3">${c.sp.map(([a, b], i) => `<div class="card">${d.niche === 'clinic' || d.niche === 'realestate' ? `<div class="about"><div class="img" style="aspect-ratio:16/10;margin-bottom:16px;background-image:url('${img(i + 2)}')"></div></div>` : ''}<h3>${esc(a)}</h3><span class="tag">${esc(b)}</span></div>`).join('')}</div>
</div></section>

<section id="gallery" class="soft"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(t.nav[2])}</span><h2>${esc(t.gallery)}</h2></div>
  <div class="grid gallery">${[0, 1, 2, 3, 4].map((i) => `<div style="background-image:url('${img(i)}')"></div>`).join('')}</div>
</div></section>

<section id="reviews" class="reviews"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(t.nav[3])}</span><h2>${esc(t.reviews)}</h2></div>
  <div class="grid g3">${c.rev.map((r, i) => `<div class="card"><div class="stars">★★★★★</div><p>“${esc(r)}”</p><div class="who"><b>${rv[i]}</b></div></div>`).join('')}</div>
  <p class="note">${esc(t.reviewsNote)}</p>
</div></section>

<section id="contact" class="soft"><div class="wrap grid g2 contact">
  <div class="card">
    <span class="eyebrow">${esc(t.nav[4])}</span><h2>${esc(c.cta)}</h2>
    <form onsubmit="event.preventDefault();${waLink ? `var f=this;window.open('${waLink}?text='+encodeURIComponent(f.n.value+' — '+f.s.value+' — '+f.m.value),'_blank')` : `alert('${esc(t.fNote)}')`}">
      <label>${esc(t.fName)}<input name="n" required autocomplete="name"></label>
      <label>${esc(t.fPhone)}<input name="p" type="tel" required autocomplete="tel"></label>
      <label>${esc(c.fSvc)}<select name="s">${c.svc.map(([a]) => `<option>${esc(a)}</option>`).join('')}</select></label>
      <label>${esc(t.fMsg)}<textarea name="m" rows="3"></textarea></label>
      <button class="btn" type="submit">${esc(t.fSend)}</button>
      <p class="note" style="margin:0">${esc(t.fNote)}</p>
    </form>
  </div>
  <div>
    <div class="map"><iframe loading="lazy" title="${esc(t.map)}" src="https://www.google.com/maps?q=${mapsQ}&output=embed"></iframe></div>
    <div class="info">
      <a href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank" rel="noopener">${svg('pin')}${esc(d.name)}, ${esc(v.city)}</a>
      ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener">${svg('phone')}<span dir="ltr">${esc(d.whatsapp)}</span></a>` : ''}
      ${igLink ? `<a href="${esc(igLink)}" target="_blank" rel="noopener">${svg('insta')}Instagram</a>` : ''}
    </div>
  </div>
</div></section>
</main>

<footer><div class="wrap row"><div>© ${new Date().getFullYear()} ${esc(d.name)} · ${esc(t.rights)}</div><div>${esc(fill(t.bar, v))}</div></div></footer>
${chat !== '#contact' ? `<a class="fab" href="${esc(chat)}" target="_blank" rel="noopener" aria-label="${esc(t.whatsapp)}" style="${waLink ? '' : 'background:var(--brand)'}">${waLink ? WA : svg('insta')}</a>` : ''}
</body></html>`;
}

const AR_CITY = { dubai: 'دبي', 'abu dhabi': 'أبوظبي', sharjah: 'الشارقة', ajman: 'عجمان', 'ras al khaimah': 'رأس الخيمة', 'al ain': 'العين', fujairah: 'الفجيرة', 'umm al quwain': 'أم القيوين', riyadh: 'الرياض', jeddah: 'جدة', dammam: 'الدمام', khobar: 'الخبر', 'al khobar': 'الخبر', madinah: 'المدينة المنورة', medina: 'المدينة المنورة', makkah: 'مكة المكرمة', mecca: 'مكة المكرمة', doha: 'الدوحة', kuwait: 'الكويت', 'kuwait city': 'مدينة الكويت', hawalli: 'حولي', salmiya: 'السالمية', farwaniya: 'الفروانية', jahra: 'الجهراء', 'al rayyan': 'الريان', lusail: 'لوسيل', 'al wakrah': 'الوكرة', taif: 'الطائف', abha: 'أبها', buraidah: 'بريدة', jubail: 'الجبيل' };

function normalize(r) {
  const niche = niches[r.niche] ? r.niche : 'clinic';
  let lang = (r.lang || r.message_lang || 'en').toLowerCase();
  if (!ui[lang]) lang = 'en';
  const color = /^#[0-9a-f]{6}$/i.test(r.color || r.brand_color || '') ? (r.color || r.brand_color) : niches[niche].color;
  const city = r.city.trim();
  const cityLocal = AR_CITY[city.toLowerCase()] ? { ar: AR_CITY[city.toLowerCase()] } : {};
  return { name: r.name.trim(), niche, city, cityLocal, lang, color, whatsapp: r.whatsapp || '', instagram: r.instagram || '', maps: r.maps || '', logo: r.logo || r.logo_url || '' };
}

function buildOne(raw, tokens) {
  const d = normalize(raw);
  const token = tokenFor(d, tokens);
  const dir = path.join(OUT, token);
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).find((f) => /^logo\.(png|jpg|webp|svg|ico)$/.test(f));
  d.logoFile = existing || fetchLogo(d.logo, dir);
  const [l1, l2] = langPair(d.lang);
  fs.writeFileSync(path.join(dir, 'index.html'), render(d, l1, l2, 0));
  fs.mkdirSync(path.join(dir, l2), { recursive: true });
  fs.writeFileSync(path.join(dir, l2, 'index.html'), render(d, l2, l1, 1));
  const rel = `d/${token}/`;
  return { token, rel, url: BASE ? `${BASE}/${rel}` : rel, logo: d.logoFile ? 'business logo' : 'monogram' };
}

// ---------- CSV (RFC4180) ----------
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (ch !== '\r') f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [h, ...rest] = rows; return rest.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ''])));
}

// ---------- CLI ----------
function args() {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2); o[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; }
  return o;
}

if (require.main === module) {
  const o = args();
  const tokens = loadTokens();
  if (o.all || o.from) {
    const file = path.resolve(o.from || path.join(ROOT, 'data', 'leads_build.json'));
    const list = file.endsWith('.json') ? JSON.parse(fs.readFileSync(file, 'utf8')) : parseCSV(fs.readFileSync(file, 'utf8'));
    const lim = o.limit ? +o.limit : list.length;
    const res = {};
    list.slice(0, lim).forEach((r, i) => { const x = buildOne(r, tokens); res[keyOf(normalize(r))] = x; process.stdout.write(`\r${i + 1}/${lim}`); });
    saveTokens(tokens);
    fs.writeFileSync(path.join(ROOT, 'data', 'build_result.json'), JSON.stringify(res, null, 1));
    console.log(`\nBuilt ${Object.keys(res).length} demos → public/d/`);
  } else if (o.name) {
    const x = buildOne({ name: o.name, niche: o.niche, city: o.city || '', lang: o.lang, color: o.color, whatsapp: o.whatsapp, instagram: o.instagram, maps: o.maps, logo: o.logo }, tokens);
    saveTokens(tokens);
    console.log(`Demo ready: public/${x.rel}index.html\nURL: ${x.url}\nLogo: ${x.logo}`);
  } else {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
  }
}

module.exports = { buildOne, render, parseCSV, loadTokens, saveTokens, keyOf, normalize };
