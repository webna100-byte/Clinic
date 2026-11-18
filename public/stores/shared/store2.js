/* Bytevia marketplace engine (v2): ratings, deals, filters, sliders, mega menu, COD checkout. EN/AR + RTL. Demo only. */
(function () {
  var UI = {
    en: { all: 'All', search: 'Search products', sort: 'Sort by', featured: 'Featured', low: 'Price: low to high', high: 'Price: high to low', rating: 'Avg. rating', az: 'Name', add: 'Add to cart', added: 'Added to cart', cart: 'Your cart', empty: 'Your cart is empty', subtotal: 'Subtotal', checkout: 'Checkout', results: 'results', none: 'No products match your filters', remove: 'Remove', view: 'Quick view', close: 'Close', lang: 'العربية', dept: 'Department', price: 'Price', anyPrice: 'Any price', rate: 'Customer reviews', up: '& up', clear: 'Clear filters', off: 'off', fast: 'Fast delivery', reduced: 'Reduced price!', coins: 'reward points', buynow: 'Buy now', qty: 'Qty', delivery: 'Delivery', deliverTo: 'Free delivery on orders over', inStock: 'In stock', freeLeft: 'more for free delivery', freeOk: 'You get free delivery!', demo: 'Demo store: checkout is not connected.', co: 'Complete your order', name: 'Full name', phone: 'Mobile number', city: 'City', addr: 'Address', pay: 'Payment', cod: 'Cash on delivery', card: 'Card (demo)', place: 'Place order', placed: 'Order received (demo). Pay on delivery.', fee: 'Delivery fee', free: 'Free', total: 'Total', ret: '7-day returns', ratings: 'ratings' },
    ar: { all: 'الكل', search: 'ابحث عن منتج', sort: 'ترتيب حسب', featured: 'المميزة', low: 'السعر: من الأقل', high: 'السعر: من الأعلى', rating: 'التقييم', az: 'الاسم', add: 'أضف إلى السلة', added: 'تمت الإضافة إلى السلة', cart: 'سلتك', empty: 'سلتك فارغة', subtotal: 'المجموع', checkout: 'إتمام الشراء', results: 'نتيجة', none: 'لا توجد منتجات مطابقة', remove: 'حذف', view: 'عرض سريع', close: 'إغلاق', lang: 'English', dept: 'القسم', price: 'السعر', anyPrice: 'أي سعر', rate: 'تقييمات العملاء', up: 'فأكثر', clear: 'مسح التصفية', off: 'خصم', fast: 'توصيل سريع', reduced: 'سعر مخفّض!', coins: 'نقاط مكافآت', buynow: 'اشترِ الآن', qty: 'الكمية', delivery: 'التوصيل', deliverTo: 'توصيل مجاني للطلبات فوق', inStock: 'متوفر', freeLeft: 'متبقية للتوصيل المجاني', freeOk: 'حصلت على توصيل مجاني!', demo: 'متجر تجريبي: الدفع غير مفعّل.', co: 'إتمام الطلب', name: 'الاسم الكامل', phone: 'رقم الجوال', city: 'المدينة', addr: 'العنوان', pay: 'الدفع', cod: 'الدفع عند الاستلام', card: 'بطاقة (تجريبي)', place: 'تأكيد الطلب', placed: 'تم استلام طلبك (تجريبي). الدفع عند الاستلام.', fee: 'رسوم التوصيل', free: 'مجاني', total: 'الإجمالي', ret: 'إرجاع خلال 7 أيام', ratings: 'تقييم' },
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var S = { lang: 'en', cat: 'all', q: '', sort: 'featured', price: 'any', rate: 0, cart: {}, opts: {}, imgBase: '../shared/img/' };
  var RANGES = { any: null, u50: [0, 50], '50': [50, 100], '100': [100, 200], '200': [200, 1e9] };

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function t(k) { return UI[S.lang][k] || k; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cur() { return S.opts.cur || { sym: '$', rate: 1, round: 1, after: false }; }
  function local(usd) { var c = cur(), v = Math.max(c.round, Math.round(usd * c.rate / c.round) * c.round); return v; }
  function money(usd) { var c = cur(), v = local(usd).toLocaleString('en-US'); return (S.lang === 'ar' && c.after !== false && c.sym !== '$') ? v + ' ' + c.sym : c.sym + (c.sym.length > 1 ? ' ' : '') + v; }
  function meta(p) {
    var r = Math.round((3.8 + ((p.id * 7) % 12) / 10) * 10) / 10, n = 12 + (p.id * 997) % 3400;
    var old = (p.badge === 'sale' || p.id % 4 === 0) ? Math.round(p.price * (1.18 + ((p.id * 3) % 9) / 50)) : 0;
    return { r: r, n: n, old: old, off: old ? Math.round((1 - p.price / old) * 100) : 0, coins: Math.round(local(p.price) * 2) };
  }
  function stars(r) { var f = Math.round(r * 2) / 2, h = ''; for (var i = 1; i <= 5; i++) h += i <= f ? '★' : (i - 0.5 === f ? '⯨' : '☆'); return '<span class="stars" aria-label="' + r + '/5">' + h + '</span>'; }
  function pname(p) { return p[S.lang][0]; }
  function pdesc(p) { return p[S.lang][1]; }
  function byId(id) { return window.PRODUCTS.filter(function (p) { return p.id === +id; })[0]; }

  function list() {
    var q = S.q.trim().toLowerCase(), rg = RANGES[S.price];
    var r = window.PRODUCTS.filter(function (p) {
      var lp = local(p.price);
      if (S.cat !== 'all' && p.cat !== S.cat) return false;
      if (rg) { var u = p.price; if (u < rg[0] || u >= rg[1]) return false; }
      if (S.rate && meta(p).r < S.rate) return false;
      if (!q) return true;
      return (p.en[0] + ' ' + p.ar[0] + ' ' + p.en[1] + ' ' + p.ar[1]).toLowerCase().indexOf(q) > -1;
    });
    if (S.sort === 'low') r.sort(function (a, b) { return a.price - b.price; });
    if (S.sort === 'high') r.sort(function (a, b) { return b.price - a.price; });
    if (S.sort === 'rating') r.sort(function (a, b) { return meta(b).r - meta(a).r; });
    if (S.sort === 'az') r.sort(function (a, b) { return pname(a).localeCompare(pname(b), S.lang); });
    return r;
  }

  function card(p) {
    var m = meta(p);
    return '<article class="card" data-id="' + p.id + '">' +
      '<button class="thumb" data-open="' + p.id + '" aria-label="' + esc(pname(p)) + '"><img loading="lazy" src="' + S.imgBase + p.img + '.jpg" alt="' + esc(pname(p)) + '">' +
      (m.off ? '<span class="off-badge">-' + m.off + '%</span>' : '') + '</button>' +
      '<div class="meta"><h3><button data-open="' + p.id + '">' + esc(pname(p)) + '</button></h3>' +
      '<div class="rate">' + stars(m.r) + '<em>' + m.n.toLocaleString('en-US') + '</em></div>' +
      '<div class="pr"><b class="price">' + money(p.price) + '</b>' + (m.old ? '<s class="old">' + money(m.old) + '</s>' : '') + '</div>' +
      (m.old ? '<span class="reduced">' + esc(t('reduced')) + '</span>' : '') +
      '<span class="fast">' + esc(t('fast')) + '</span><span class="coins">+' + m.coins + ' ' + esc(t('coins')) + '</span>' +
      '<button class="add" data-add="' + p.id + '">' + esc(t('add')) + '</button></div></article>';
  }

  function renderFilters() {
    var el = $('#filters');
    if (el) { var h = '<button class="chip' + (S.cat === 'all' ? ' on' : '') + '" data-cat="all">' + esc(t('all')) + '</button>'; Object.keys(window.CATS).forEach(function (k) { h += '<button class="chip' + (S.cat === k ? ' on' : '') + '" data-cat="' + k + '">' + esc(window.CATS[k][S.lang]) + '</button>'; }); el.innerHTML = h; }
    var fc = $('#f-cats');
    if (fc) { var o = '<button class="fl' + (S.cat === 'all' ? ' on' : '') + '" data-cat="all">' + esc(t('all')) + '</button>'; Object.keys(window.CATS).forEach(function (k) { o += '<button class="fl' + (S.cat === k ? ' on' : '') + '" data-cat="' + k + '">' + esc(window.CATS[k][S.lang]) + '</button>'; }); fc.innerHTML = o; }
    var fp = $('#f-price');
    if (fp) { var lab = { any: t('anyPrice'), u50: '< ' + money(50), '50': money(50) + ' – ' + money(100), '100': money(100) + ' – ' + money(200), '200': money(200) + '+' }; fp.innerHTML = Object.keys(lab).map(function (k) { return '<button class="fl' + (S.price === k ? ' on' : '') + '" data-pr="' + k + '">' + esc(lab[k]) + '</button>'; }).join(''); }
    var fr = $('#f-rate');
    if (fr) fr.innerHTML = [4, 3].map(function (r) { return '<button class="fl' + (S.rate === r ? ' on' : '') + '" data-rt="' + r + '">' + stars(r) + ' ' + esc(t('up')) + '</button>'; }).join('');
    var mm = $('#mega');
    if (mm) mm.innerHTML = Object.keys(window.CATS).map(function (k) { return '<div class="mcol"><button class="mh" data-cat="' + k + '">' + esc(window.CATS[k][S.lang]) + '</button>' + window.TREE[k][S.lang].map(function (x) { return '<button data-cat="' + k + '">' + esc(x) + '</button>'; }).join('') + '</div>'; }).join('');
  }

  function renderGrid() {
    var g = $('#grid'); if (!g) return;
    var r = list();
    g.innerHTML = r.length ? r.map(card).join('') : '<p class="none">' + esc(t('none')) + '</p>';
    var c = $('#count'); if (c) c.textContent = r.length + ' ' + t('results');
    var d = $('#deals');
    if (d) d.innerHTML = window.PRODUCTS.filter(function (p) { return meta(p).old; }).sort(function (a, b) { return meta(b).off - meta(a).off; }).slice(0, 10).map(card).join('');
    var nw = $('#newin');
    if (nw) { var seen = {}; nw.innerHTML = window.PRODUCTS.filter(function (p) { return p.badge === 'new'; }).concat(window.PRODUCTS.slice(8)).filter(function (p) { if (seen[p.id]) return false; seen[p.id] = 1; return true; }).slice(0, 8).map(card).join(''); }
  }

  function cartLines() { return Object.keys(S.cart).map(function (id) { return { p: byId(id), q: S.cart[id] }; }).filter(function (x) { return x.p; }); }
  function totals() { var n = 0, tot = 0; cartLines().forEach(function (l) { n += l.q; tot += l.q * local(l.p.price); }); return { n: n, tot: tot }; }
  function mfmt(v) { var c = cur(); var s = v.toLocaleString('en-US'); return (S.lang === 'ar' && c.after !== false && c.sym !== '$') ? s + ' ' + c.sym : c.sym + (c.sym.length > 1 ? ' ' : '') + s; }

  function renderCart() {
    var ls = cartLines(), T = totals();
    $$('[data-cart-count]').forEach(function (e) { e.textContent = T.n; e.hidden = !T.n; });
    $$('[data-cart-total]').forEach(function (e) { e.textContent = mfmt(T.tot); });
    var it = $('#drawer-items');
    if (it) it.innerHTML = ls.length ? ls.map(function (l) {
      return '<div class="line"><img src="' + S.imgBase + l.p.img + '.jpg" alt=""><div class="li"><b>' + esc(pname(l.p)) + '</b><span>' + money(l.p.price) + '</span>' +
        '<div class="qty"><button data-dec="' + l.p.id + '" aria-label="-">−</button><i>' + l.q + '</i><button data-inc="' + l.p.id + '" aria-label="+">+</button></div></div>' +
        '<button class="rm" data-rm="' + l.p.id + '" aria-label="' + esc(t('remove')) + '">×</button></div>';
    }).join('') : '<p class="none">' + esc(t('empty')) + '</p>';
    var tt = $('#drawer-total'); if (tt) tt.textContent = mfmt(T.tot);
    var ck = $('#checkout'); if (ck) ck.disabled = !ls.length;
    var fs = S.opts.freeShip;
    if (fs) {
      var lim = local(fs), left = Math.max(0, lim - T.tot), pct = Math.min(100, Math.round(T.tot / lim * 100));
      var bar = $('#ship-bar'); if (bar) bar.style.width = pct + '%';
      var tx = $('#ship-text'); if (tx) tx.textContent = T.tot >= lim ? t('freeOk') : mfmt(left) + ' ' + t('freeLeft');
    }
    store('bv_cart2', S.cart);
  }

  function toast(m) { var e = $('#toast'); if (!e) return; e.textContent = m; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('show'); }, 2000); }
  function add(id, n) { S.cart[id] = (S.cart[id] || 0) + (n || 1); renderCart(); toast(t('added')); }

  function openModal(id) {
    var p = byId(id), m = $('#modal'); if (!p || !m) return;
    var x = meta(p);
    $('#modal-body').innerHTML = '<div class="mimg"><img src="' + S.imgBase + p.img + '.jpg" alt="' + esc(pname(p)) + '"></div><div class="minfo">' +
      '<span class="cat">' + esc(window.CATS[p.cat][S.lang]) + '</span><h2>' + esc(pname(p)) + '</h2>' +
      '<div class="rate">' + stars(x.r) + '<em>' + x.r + ' · ' + x.n.toLocaleString('en-US') + ' ' + esc(t('ratings')) + '</em></div>' +
      '<div class="pr big"><b class="price">' + money(p.price) + '</b>' + (x.old ? '<s class="old">' + money(x.old) + '</s><span class="off-badge inline">-' + x.off + '%</span>' : '') + '</div>' +
      '<p>' + esc(pdesc(p)) + '</p><ul class="bul"><li>' + esc(t('inStock')) + '</li><li>' + esc(t('fast')) + '</li><li>' + esc(t('ret')) + '</li></ul>' +
      '<label class="ql">' + esc(t('qty')) + ' <select id="mq">' + [1, 2, 3, 4, 5].map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select></label>' +
      '<div class="macts"><button class="btn" data-addq="' + p.id + '">' + esc(t('add')) + '</button><button class="btn alt" data-buy="' + p.id + '">' + esc(t('buynow')) + '</button></div></div>';
    m.classList.add('open'); document.body.classList.add('lock');
  }
  function closeAll() { $$('.open').forEach(function (e) { if (!e.hasAttribute('data-keep')) e.classList.remove('open'); }); document.body.classList.remove('lock'); var l = $('#co'); if (l) l.classList.remove('open'); }

  function openCheckout() {
    var m = $('#co'); if (!m) { toast(t('demo')); return; }
    var T = totals(), c = cur(), fs = S.opts.freeShip ? local(S.opts.freeShip) : 0, fee = (fs && T.tot >= fs) ? 0 : (S.opts.fee || 0);
    $('#co-sum').innerHTML = '<div><span>' + esc(t('subtotal')) + '</span><b>' + mfmt(T.tot) + '</b></div><div><span>' + esc(t('fee')) + '</span><b>' + (fee ? mfmt(fee) : esc(t('free'))) + '</b></div><div class="tot"><span>' + esc(t('total')) + '</span><b>' + mfmt(T.tot + fee) + '</b></div>';
    $('#drawer').classList.remove('open'); m.classList.add('open'); document.body.classList.add('lock');
  }

  function applyLang() {
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    $$('[data-tx]').forEach(function (e) { var k = e.getAttribute('data-tx'); var v = S.opts.text && S.opts.text[S.lang] && S.opts.text[S.lang][k]; if (v != null) e.innerHTML = v; });
    $$('[data-ph]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-ph')); });
    $$('[data-lang-toggle]').forEach(function (e) { e.textContent = t('lang'); });
    var so = $('#sort'); if (so) so.innerHTML = ['featured', 'low', 'high', 'rating', 'az'].map(function (k) { return '<option value="' + k + '"' + (S.sort === k ? ' selected' : '') + '>' + esc(t(k)) + '</option>'; }).join('');
    $$('[data-money]').forEach(function (e) { e.textContent = money(+e.getAttribute('data-money')); });
    var cc = $('#co-city'); if (cc && S.opts.cities) cc.innerHTML = S.opts.cities[S.lang].map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    store('bv_lang_' + S.opts.id, S.lang);
    renderFilters(); renderGrid(); renderCart();
  }

  function sliders() {
    $$('[data-slider]').forEach(function (sl) {
      var slides = $$('.slide', sl), i = 0, dots = $('.dots', sl);
      if (dots) dots.innerHTML = slides.map(function (_, k) { return '<button data-dot="' + k + '" aria-label="' + (k + 1) + '"></button>'; }).join('');
      function go(n) { i = (n + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle('on', k === i); }); $$('[data-dot]', sl).forEach(function (d, k) { d.classList.toggle('on', k === i); }); }
      sl.addEventListener('click', function (e) { var d = e.target.closest('[data-dot]'); if (d) go(+d.getAttribute('data-dot')); if (e.target.closest('[data-prev]')) go(i - 1); if (e.target.closest('[data-next]')) go(i + 1); });
      go(0);
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) setInterval(function () { go(i + 1); }, 5500);
    });
  }

  function bind() {
    document.addEventListener('click', function (ev) {
      var e = ev.target.closest('[data-add],[data-addq],[data-buy],[data-open],[data-cat],[data-pr],[data-rt],[data-clear],[data-inc],[data-dec],[data-rm],[data-cart-open],[data-close],[data-lang-toggle],[data-toggle],#checkout');
      if (!e) { var tg = $$('[data-pop].open'); if (tg.length && !ev.target.closest('[data-pop]')) tg.forEach(function (x) { x.classList.remove('open'); }); return; }
      if (e.hasAttribute('data-add')) add(e.getAttribute('data-add'));
      else if (e.hasAttribute('data-addq')) { add(e.getAttribute('data-addq'), +$('#mq').value); closeAll(); }
      else if (e.hasAttribute('data-buy')) { S.cart[e.getAttribute('data-buy')] = (S.cart[e.getAttribute('data-buy')] || 0) + (+$('#mq').value); renderCart(); closeAll(); openCheckout(); }
      else if (e.hasAttribute('data-open')) openModal(e.getAttribute('data-open'));
      else if (e.hasAttribute('data-cat')) { S.cat = e.getAttribute('data-cat'); $$('[data-pop]').forEach(function (x) { x.classList.remove('open'); }); renderFilters(); renderGrid(); var g = $('#shop'); if (g && ev.isTrusted) g.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (e.hasAttribute('data-pr')) { S.price = e.getAttribute('data-pr'); renderFilters(); renderGrid(); }
      else if (e.hasAttribute('data-rt')) { S.rate = S.rate === +e.getAttribute('data-rt') ? 0 : +e.getAttribute('data-rt'); renderFilters(); renderGrid(); }
      else if (e.hasAttribute('data-clear')) { S.cat = 'all'; S.price = 'any'; S.rate = 0; S.q = ''; var s0 = $('#search'); if (s0) s0.value = ''; renderFilters(); renderGrid(); }
      else if (e.hasAttribute('data-inc')) { S.cart[e.getAttribute('data-inc')]++; renderCart(); }
      else if (e.hasAttribute('data-dec')) { var i = e.getAttribute('data-dec'); S.cart[i]--; if (S.cart[i] <= 0) delete S.cart[i]; renderCart(); }
      else if (e.hasAttribute('data-rm')) { delete S.cart[e.getAttribute('data-rm')]; renderCart(); }
      else if (e.hasAttribute('data-cart-open')) { $('#drawer').classList.add('open'); document.body.classList.add('lock'); }
      else if (e.hasAttribute('data-close')) closeAll();
      else if (e.hasAttribute('data-toggle')) { var tgt = $(e.getAttribute('data-toggle')); if (tgt) { var o = !tgt.classList.contains('open'); $$('[data-pop]').forEach(function (x) { x.classList.remove('open'); }); tgt.classList.toggle('open', o); } ev.stopPropagation(); }
      else if (e.hasAttribute('data-lang-toggle')) { S.lang = S.lang === 'en' ? 'ar' : 'en'; applyLang(); }
      else if (e.id === 'checkout') openCheckout();
    });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { closeAll(); $$('[data-pop]').forEach(function (x) { x.classList.remove('open'); }); } });
    var s = $('#search'); if (s) { s.addEventListener('input', function () { S.q = s.value; renderGrid(); }); var f = s.closest('form'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); renderGrid(); var g = $('#shop'); if (g) g.scrollIntoView({ behavior: 'smooth' }); }); }
    var so = $('#sort'); if (so) so.addEventListener('change', function () { S.sort = so.value; renderGrid(); });
    var sc = $('#search-cat'); if (sc) { sc.innerHTML = '<option value="all">' + esc(t('all')) + '</option>' + Object.keys(window.CATS).map(function (k) { return '<option value="' + k + '">' + esc(window.CATS[k][S.lang]) + '</option>'; }).join(''); sc.addEventListener('change', function () { S.cat = sc.value; renderFilters(); renderGrid(); }); }
    var cf = $('#co-form'); if (cf) cf.addEventListener('submit', function (e) { e.preventDefault(); S.cart = {}; renderCart(); closeAll(); toast(t('placed')); });
  }

  window.Store = {
    init: function (opts) {
      S.opts = opts || {}; if (S.opts.imgBase) S.imgBase = S.opts.imgBase;
      S.lang = store('bv_lang_' + S.opts.id) || S.opts.lang || 'en'; S.cart = store('bv_cart2') || {};
      bind(); sliders(); applyLang();
    },
  };
})();
