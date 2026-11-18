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
const LABEL = {
  clinic: { en: 'Clinic', ar: 'عيادة', nl: 'Kliniek', de: 'Klinik', fr: 'Clinique', da: 'Klinik', no: 'Klinikk', sv: 'Klinik', fi: 'Klinikka' },
  law: { en: 'Law & consulting', ar: 'محاماة واستشارات', nl: 'Juridisch advies', de: 'Recht & Beratung', fr: 'Droit & conseil', da: 'Jura & rådgivning', no: 'Juss & rådgivning', sv: 'Juridik & rådgivning', fi: 'Laki & neuvonta' },
  home: { en: 'Home services', ar: 'خدمات منزلية', nl: 'Diensten aan huis', de: 'Haus & Service', fr: 'Services à domicile', da: 'Håndværkerservice', no: 'Håndverkertjenester', sv: 'Hemservice', fi: 'Kotipalvelut' },
  salon: { en: 'Salon & beauty', ar: 'صالون وعناية', nl: 'Salon & beauty', de: 'Salon & Beauty', fr: 'Salon & beauté', da: 'Salon & skønhed', no: 'Salong & skjønnhet', sv: 'Salong & skönhet', fi: 'Kauneus & kampaamo' },
  realestate: { en: 'Real estate', ar: 'عقارات', nl: 'Makelaardij', de: 'Immobilien', fr: 'Immobilier', da: 'Ejendomsmægler', no: 'Eiendomsmegler', sv: 'Fastighetsmäklare', fi: 'Kiinteistönvälitys' },
  gym: { en: 'Fitness studio', ar: 'نادي رياضي', nl: 'Fitness studio', de: 'Fitnessstudio', fr: 'Studio de fitness', da: 'Fitnessstudie', no: 'Treningssenter', sv: 'Träningsstudio', fi: 'Kuntosali' },
  restaurant: { en: 'Restaurant & café', ar: 'مطعم وكافيه', nl: 'Restaurant & café', de: 'Restaurant & Café', fr: 'Restaurant & café', da: 'Restaurant & café', no: 'Restaurant & kafé', sv: 'Restaurang & café', fi: 'Ravintola & kahvila' },
};
const keyOf = (r) => (r.name + '|' + r.city).toLowerCase().replace(/\s+/g, ' ').trim();

function loadTokens() { try { return JSON.parse(fs.readFileSync(TOKENS, 'utf8')); } catch { return {}; } }
function saveTokens(t) { fs.mkdirSync(path.dirname(TOKENS), { recursive: true }); fs.writeFileSync(TOKENS, JSON.stringify(t, null, 1)); }
function tokenFor(r, tokens) {
  const k = keyOf(r);
  if (!tokens[k]) {
    const slug = r.name.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_]+/g, '-').slice(0, 24).replace(/-+$/, '');
    tokens[k] = (r.niche && niches[r.niche] ? r.niche + '-' : '') + (slug ? slug + '-' : '') + crypto.randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, 'x');
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
const { MENUS, price: fmtPrice } = require('./menu');
const PL = {
  en: { home: 'Home', services: 'Services', prices: 'Prices', gallery: 'Gallery', about: 'About', contact: 'Contact', all: 'View all', menu: 'Menu', pricesT: 'Prices & options', pricesS: 'Clear prices for our most requested services.', sample: 'Sample prices for this design concept. They will be replaced with your real prices.', galleryS: 'A look at our work and our space.', servicesS: 'Everything we offer, in one place.', aboutS: 'Who we are and why people choose us.', contactS: 'Send a request or visit us.', top: 'Popular prices', seeP: 'See full price list', seeG: 'See more photos', book: 'Book', opts: 'Options' },
  ar: { home: 'الرئيسية', services: 'الخدمات', prices: 'الأسعار', gallery: 'المعرض', about: 'من نحن', contact: 'تواصل معنا', all: 'عرض الكل', menu: 'القائمة', pricesT: 'الأسعار والخيارات', pricesS: 'أسعار واضحة لأكثر خدماتنا طلبًا.', sample: 'أسعار تجريبية لهذا التصميم، وتُستبدل بأسعاركم الفعلية.', galleryS: 'لمحة عن أعمالنا ومكاننا.', servicesS: 'كل ما نقدّمه في مكان واحد.', aboutS: 'من نحن ولماذا يختارنا الناس.', contactS: 'أرسل طلبك أو زرنا.', top: 'أسعار شائعة', seeP: 'عرض قائمة الأسعار كاملة', seeG: 'عرض المزيد من الصور', book: 'احجز', opts: 'الخيارات' },
  nl: { home: 'Home', services: 'Diensten', prices: 'Prijzen', gallery: 'Galerij', about: 'Over ons', contact: 'Contact', all: 'Alles bekijken', menu: 'Menu', pricesT: 'Prijzen & opties', pricesS: 'Duidelijke prijzen voor onze meest gevraagde diensten.', sample: 'Voorbeeldprijzen voor dit ontwerp. Ze worden vervangen door jullie echte prijzen.', galleryS: 'Een kijkje bij ons werk.', servicesS: 'Alles wat we bieden.', aboutS: 'Wie we zijn.', contactS: 'Stuur een aanvraag of kom langs.', top: 'Populaire prijzen', seeP: 'Volledige prijslijst', seeG: 'Meer foto’s', book: 'Boek', opts: 'Opties' },
  de: { home: 'Start', services: 'Leistungen', prices: 'Preise', gallery: 'Galerie', about: 'Über uns', contact: 'Kontakt', all: 'Alle ansehen', menu: 'Menü', pricesT: 'Preise & Optionen', pricesS: 'Klare Preise für unsere gefragtesten Leistungen.', sample: 'Beispielpreise für dieses Designkonzept. Sie werden durch Ihre echten Preise ersetzt.', galleryS: 'Ein Blick auf unsere Arbeit.', servicesS: 'Alles, was wir anbieten.', aboutS: 'Wer wir sind.', contactS: 'Anfrage senden oder vorbeikommen.', top: 'Beliebte Preise', seeP: 'Komplette Preisliste', seeG: 'Mehr Fotos', book: 'Buchen', opts: 'Optionen' },
  fr: { home: 'Accueil', services: 'Services', prices: 'Tarifs', gallery: 'Galerie', about: 'À propos', contact: 'Contact', all: 'Tout voir', menu: 'Menu', pricesT: 'Tarifs & options', pricesS: 'Des tarifs clairs pour nos services les plus demandés.', sample: "Tarifs d'exemple pour ce concept. Ils seront remplacés par vos vrais tarifs.", galleryS: 'Un aperçu de notre travail.', servicesS: 'Tout ce que nous proposons.', aboutS: 'Qui nous sommes.', contactS: 'Envoyez une demande ou passez nous voir.', top: 'Tarifs populaires', seeP: 'Voir tous les tarifs', seeG: 'Plus de photos', book: 'Réserver', opts: 'Options' },
  da: { home: 'Forside', services: 'Ydelser', prices: 'Priser', gallery: 'Galleri', about: 'Om os', contact: 'Kontakt', all: 'Se alle', menu: 'Menu', pricesT: 'Priser & valg', pricesS: 'Klare priser på vores mest efterspurgte ydelser.', sample: 'Eksempelpriser til dette designkoncept. De erstattes af jeres rigtige priser.', galleryS: 'Et kig på vores arbejde.', servicesS: 'Alt det, vi tilbyder.', aboutS: 'Hvem vi er.', contactS: 'Send en forespørgsel eller kig forbi.', top: 'Populære priser', seeP: 'Se hele prislisten', seeG: 'Flere billeder', book: 'Book', opts: 'Valg' },
  no: { home: 'Hjem', services: 'Tjenester', prices: 'Priser', gallery: 'Galleri', about: 'Om oss', contact: 'Kontakt', all: 'Se alle', menu: 'Meny', pricesT: 'Priser & valg', pricesS: 'Tydelige priser på våre mest ettertraktede tjenester.', sample: 'Eksempelpriser for dette designkonseptet. De erstattes av deres egne priser.', galleryS: 'Et blikk på arbeidet vårt.', servicesS: 'Alt vi tilbyr.', aboutS: 'Hvem vi er.', contactS: 'Send en forespørsel eller kom innom.', top: 'Populære priser', seeP: 'Se hele prislisten', seeG: 'Flere bilder', book: 'Bestill', opts: 'Valg' },
  sv: { home: 'Hem', services: 'Tjänster', prices: 'Priser', gallery: 'Galleri', about: 'Om oss', contact: 'Kontakt', all: 'Visa alla', menu: 'Meny', pricesT: 'Priser & val', pricesS: 'Tydliga priser på våra mest efterfrågade tjänster.', sample: 'Exempelpriser för detta designkoncept. De ersätts med era riktiga priser.', galleryS: 'En titt på vårt arbete.', servicesS: 'Allt vi erbjuder.', aboutS: 'Vilka vi är.', contactS: 'Skicka en förfrågan eller kom förbi.', top: 'Populära priser', seeP: 'Se hela prislistan', seeG: 'Fler bilder', book: 'Boka', opts: 'Val' },
  fi: { home: 'Etusivu', services: 'Palvelut', prices: 'Hinnat', gallery: 'Galleria', about: 'Meistä', contact: 'Yhteystiedot', all: 'Näytä kaikki', menu: 'Valikko', pricesT: 'Hinnat ja vaihtoehdot', pricesS: 'Selkeät hinnat suosituimmille palveluillemme.', sample: 'Esimerkkihinnat tälle konseptille. Ne korvataan oikeilla hinnoillanne.', galleryS: 'Katsaus työhömme.', servicesS: 'Kaikki tarjoamamme.', aboutS: 'Keitä me olemme.', contactS: 'Lähetä pyyntö tai tule käymään.', top: 'Suositut hinnat', seeP: 'Koko hinnasto', seeG: 'Lisää kuvia', book: 'Varaa', opts: 'Vaihtoehdot' },
};
const PAGES = ['home', 'services', 'prices', 'gallery', 'about', 'contact'];

function render(d, lang, otherLang, depth) {
  const t = ui[lang], n = niches[d.niche], c = n.copy[lang], p = PL[lang] || PL.en;
  const M = MENUS[d.niche] || MENUS.home;
  const mi = lang === 'ar' ? 1 : 0; // menu names exist in EN/AR; other languages show EN names
  const pr = (x) => fmtPrice(x, d.country, lang, M.from && typeof x === 'number' && x > 0);
  const v = { name: (lang === 'ar' && d.nameAr) || d.name, city: d.cityLocal?.[lang] || d.city };
  const up = '../'.repeat(depth);
  const assets = `${up}../../assets`;
  const imgs = [...new Set(n.images)];
  const img = (i) => `${assets}/img/${imgs[i % imgs.length]}.jpg`;
  const svcImg = (i) => `${assets}/img/${(n.svcImgs || imgs)[i % (n.svcImgs || imgs).length]}.jpg`;
  const waNum = d.gulf ? (d.whatsapp || '').replace(/[^\d]/g, '') : '';
  const telNum = (d.whatsapp || '').replace(/[^\d+]/g, '');
  const waLink = waNum ? `https://wa.me/${waNum}` : '';
  const igLink = d.instagram || '';
  const chat = waLink || igLink || '#contact';
  const mapsQ = encodeURIComponent(d.maps || `${d.name} ${d.city}`);
  const logo = d.logoFile ? `<img class="logo" src="${up}${d.logoFile}" alt="${esc(d.name)}">` : monogram(d.name, d.color);
  const otherHref = depth ? '../' : `${otherLang}/`;
  const rv = ['A.K.', 'S.M.', 'R.H.'];
  const nav = PAGES.map((k) => `<a href="#${k}" data-nav="${k}">${esc(p[k])}</a>`).join('');
  const menuItems = M.sections.flatMap((s) => s.i);
  const tel2 = waLink ? `<a class="btn ghost" href="${waLink}" target="_blank" rel="noopener">${esc(t.whatsapp)}</a>` : telNum ? `<a class="btn ghost" href="tel:${telNum}">${esc(t.call)}</a>` : igLink ? `<a class="btn ghost" href="${esc(igLink)}" target="_blank" rel="noopener">Instagram</a>` : '';
  const head = (key, sub) => `<div class="pagehead"><div class="wrap"><h1>${esc(p[key] === p.prices ? p.pricesT : p[key])}</h1><p>${esc(sub)}</p></div></div>`;
  const band = `<section class="band"><div class="wrap"><h2>${esc(fill(c.heroT, v))}</h2><a class="btn" href="#contact">${esc(c.cta)}</a></div></section>`;
  const priceRow = (it) => `<li><span>${esc(it[mi])}</span><i></i><b>${esc(pr(it[2]))}</b></li>`;
  const reviews = `<div class="head"><span class="eyebrow">${esc(t.nav[3])}</span><h2>${esc(t.reviews)}</h2></div><div class="grid g3">${c.rev.map((r, i) => `<div class="card rv"><div class="stars">★★★★★</div><p>“${esc(r)}”</p><div class="who"><b>${rv[i]}</b></div></div>`).join('')}</div><p class="note">${esc(t.reviewsNote)}</p>`;
  const svcCards = (limit) => c.svc.slice(0, limit).map(([a, b], i) => `<a class="svc" href="#prices"><div class="simg" style="background-image:url('${svcImg(i)}')"></div><div class="sbody"><h3>${esc(a)}</h3><p>${esc(b)}</p><span class="more">${esc(p.seeP)} →</span></div></a>`).join('');
  const waForm = waLink ? `var f=this;window.open('${waLink}?text='+encodeURIComponent(f.n.value+' — '+f.s.value+' — '+f.m.value),'_blank')` : `alert('${esc(t.fNote)}')`;

  const pHome = `<section class="hero"><div class="bg" style="background-image:url('${img(0)}')"></div><div class="wrap">
    <span class="kicker">${esc(LABEL[d.niche][lang])} · ${esc(v.city)}</span><h1>${esc(fill(c.heroT, v))}</h1><p>${esc(fill(c.heroS, v))}</p>
    <div class="ctas"><a class="btn" href="#contact">${esc(c.cta)}</a><a class="btn ghost" href="#prices">${esc(p.prices)}</a></div>
    <div class="trust">${t.why.map((w) => `<div>${svg('check')}${esc(w)}</div>`).join('')}</div></div></section>
  <section><div class="wrap"><div class="head row2"><div><span class="eyebrow">${esc(p.services)}</span><h2>${esc(c.svcT)}</h2></div><a class="lnk" href="#services">${esc(p.all)} →</a></div><div class="svcgrid">${svcCards(4)}</div></div></section>
  <section class="soft"><div class="wrap two"><div><span class="eyebrow">${esc(p.prices)}</span><h2>${esc(p.top)}</h2><p class="lead">${esc(p.pricesS)}</p><a class="btn" href="#prices">${esc(p.seeP)}</a></div>
    <div class="card pricecard"><ul class="plist">${M.sections[0].i.slice(0, 5).map(priceRow).join('')}</ul></div></div></section>
  <section><div class="wrap"><div class="head row2"><div><span class="eyebrow">${esc(p.gallery)}</span><h2>${esc(t.gallery)}</h2></div><a class="lnk" href="#gallery">${esc(p.seeG)} →</a></div>
    <div class="strip">${[0, 1, 2].map((i) => `<a href="#gallery" style="background-image:url('${img(i + 1)}')"></a>`).join('')}</div></div></section>
  <section class="soft reviews"><div class="wrap">${reviews}</div></section>${band}`;

  const pServices = `${head('services', p.servicesS)}<section><div class="wrap"><div class="svcgrid">${svcCards(4)}</div>
    <div class="head" style="margin-top:56px"><h2>${esc(c.spT)}</h2></div><div class="grid g3">${c.sp.map(([a, b]) => `<div class="card opt"><h3>${esc(a)}</h3><span class="tag">${esc(b)}</span></div>`).join('')}</div></div></section>${band}`;

  const pPrices = `${head('prices', p.pricesS)}<section><div class="wrap"><div class="pgrid">${M.sections.map((s) => `<div class="card pricecard"><h3>${esc(s.t[mi])}</h3><ul class="plist">${s.i.map(priceRow).join('')}</ul></div>`).join('')}</div><p class="note">${esc(p.sample)}</p></div></section>${band}`;

  const pGallery = `${head('gallery', p.galleryS)}<section><div class="wrap"><div class="gal">${imgs.map((f, i) => `<button class="gi" data-full="${assets}/img/${f}.jpg" style="background-image:url('${assets}/img/${f}.jpg')" aria-label="${esc(p.gallery)} ${i + 1}"></button>`).join('')}</div></div></section>${band}`;

  const pAbout = `${head('about', p.aboutS)}<section><div class="wrap grid g2 about"><div class="img" style="background-image:url('${img(1)}')"></div><div><span class="eyebrow">${esc(t.about)}</span><h2>${esc(v.name)}</h2><p>${esc(fill(c.aboutX, v))}</p><h3 style="margin-top:22px">${esc(t.team)}</h3><p style="color:var(--muted)">${esc(t.teamText)}</p><ul>${t.why.map((w) => `<li>${svg('check')}${esc(w)}</li>`).join('')}</ul></div></div></section><section class="soft reviews"><div class="wrap">${reviews}</div></section>${band}`;

  const pContact = `${head('contact', p.contactS)}<section><div class="wrap grid g2 contact"><div class="card"><h2>${esc(c.cta)}</h2>
    <form onsubmit="event.preventDefault();${waForm}"><label>${esc(t.fName)}<input name="n" required autocomplete="name"></label><label>${esc(t.fPhone)}<input name="p" type="tel" required autocomplete="tel"></label>
    <label>${esc(c.fSvc)}<select name="s">${M.sections.map((s) => `<optgroup label="${esc(s.t[mi])}">${s.i.map((it) => `<option>${esc(it[mi])}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <label>${esc(t.fMsg)}<textarea name="m" rows="3"></textarea></label><button class="btn" type="submit">${esc(t.fSend)}</button><p class="note" style="margin:0">${esc(t.fNote)}</p></form></div>
    <div><div class="map"><iframe loading="lazy" title="${esc(t.map)}" src="https://www.google.com/maps?q=${mapsQ}&output=embed"></iframe></div><div class="info">
    <a href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank" rel="noopener">${svg('pin')}${esc(v.name)}, ${esc(v.city)}</a>
    ${(waLink || telNum) ? `<a href="${waLink || 'tel:' + telNum}"${waLink ? ' target="_blank" rel="noopener"' : ''}>${svg('phone')}<span dir="ltr">${esc(d.whatsapp)}</span></a>` : ''}
    ${igLink ? `<a href="${esc(igLink)}" target="_blank" rel="noopener">${svg('insta')}Instagram</a>` : ''}</div></div></div></section>`;

  const pagesHtml = { home: pHome, services: pServices, prices: pPrices, gallery: pGallery, about: pAbout, contact: pContact };

  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(v.name)}</title>
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="${esc(fill(c.heroS, v))}">
<link rel="stylesheet" href="${assets}/site.css">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'LocalBusiness', name: v.name, address: { '@type': 'PostalAddress', addressLocality: v.city } })}</script>
<style>:root{--brand:${esc(d.color)}}</style>
</head>
<body>
<div class="top">
<div class="concept"><img src="${assets}/bytevia.png" alt="">${esc(fill(t.bar, v))}</div>
<header class="site"><div class="wrap nav">
  <a class="brand" href="#home">${logo}<span>${esc(v.name)}</span></a>
  <nav class="menu">${nav}</nav>
  <div class="tools"><a class="lang" href="${otherHref}">${esc(ui[otherLang].label)}</a><a class="btn sm" href="#contact">${esc(c.cta)}</a>
  <button class="burger" id="burger" aria-label="${esc(p.menu)}" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button></div>
</div>
<nav class="mnav" id="mnav" aria-label="${esc(p.menu)}"><div class="wrap">${nav}<div class="mact"><a class="btn" href="#contact">${esc(c.cta)}</a>${tel2}</div></div></nav>
</header>
</div>
<main id="top">
${PAGES.map((k) => `<div class="page" id="p-${k}" data-page="${k}"${k === 'home' ? '' : ' hidden'}>${pagesHtml[k]}</div>`).join('\n')}
</main>
<footer><div class="wrap row"><div>© ${new Date().getFullYear()} ${esc(v.name)} · ${esc(t.rights)}</div><div>${esc(fill(t.bar, v))}</div></div></footer>
${chat !== '#contact' ? `<a class="fab" href="${esc(chat)}" target="_blank" rel="noopener" aria-label="${esc(t.whatsapp)}" style="${waLink ? '' : 'background:var(--brand)'}">${waLink ? WA : svg('insta')}</a>` : ''}
<div class="lb" id="lb" hidden><img alt=""></div>
<script>(function(){
var P=${JSON.stringify(PAGES)};var b=document.getElementById('burger'),m=document.getElementById('mnav');
function show(){var h=(location.hash||'#home').slice(1);if(P.indexOf(h)<0)h='home';
 P.forEach(function(k){document.getElementById('p-'+k).hidden=(k!==h)});
 [].forEach.call(document.querySelectorAll('[data-nav]'),function(a){a.classList.toggle('on',a.getAttribute('data-nav')===h)});
 m.classList.remove('open');b.classList.remove('open');b.setAttribute('aria-expanded','false');window.scrollTo(0,0)}
b.addEventListener('click',function(){var o=!m.classList.contains('open');m.classList.toggle('open',o);b.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});
window.addEventListener('hashchange',show);show();
var lb=document.getElementById('lb');document.addEventListener('click',function(e){var g=e.target.closest('.gi');if(g){lb.querySelector('img').src=g.getAttribute('data-full');lb.hidden=false;return}if(e.target.closest('#lb'))lb.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){lb.hidden=true;m.classList.remove('open');b.classList.remove('open')}});
var e=document.querySelectorAll('.card,.svc,.gi,.head');if('IntersectionObserver' in window){var o=new IntersectionObserver(function(a){a.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');o.unobserve(x.target)}})},{threshold:.1});e.forEach(function(n){n.classList.add('rv');o.observe(n)})}
})();</script>
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
  const gulf = ['UAE','Saudi Arabia','Qatar','Kuwait'].includes(r.country || '');
  return { gulf, country: r.country || '', name: r.name.trim(), nameAr: (r.name_ar || '').trim(), niche, city, cityLocal, lang, color, whatsapp: r.whatsapp || '', instagram: r.instagram || '', maps: r.maps || '', logo: r.logo || r.logo_url || '' };
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
    const x = buildOne({ name: o.name, niche: o.niche, city: o.city || '', lang: o.lang, color: o.color, whatsapp: o.whatsapp, instagram: o.instagram, maps: o.maps, logo: o.logo, country: o.country }, tokens);
    saveTokens(tokens);
    console.log(`Demo ready: public/${x.rel}index.html\nURL: ${x.url}\nLogo: ${x.logo}`);
  } else {
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
  }
}

module.exports = { buildOne, render, parseCSV, loadTokens, saveTokens, keyOf, normalize };
