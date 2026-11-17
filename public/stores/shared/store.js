/* Bytevia store engine: bilingual (EN/AR + RTL), filters, search, sort, quick view, cart drawer.
   Each store page supplies its own HTML/CSS and calls Store.init({...}). Demo only (no payments). */
(function () {
  var UI = {
    en: { all: 'All', search: 'Search products…', sort: 'Sort', featured: 'Featured', low: 'Price: low to high', high: 'Price: high to low', az: 'Name', add: 'Add to cart', added: 'Added to cart', cart: 'Your cart', empty: 'Your cart is empty', subtotal: 'Subtotal', checkout: 'Checkout', demo: 'Demo store: checkout is not connected.', results: 'products', none: 'No products found', remove: 'Remove', shipping: 'Shipping and taxes calculated at checkout.', view: 'Quick view', new: 'New', sale: 'Sale', close: 'Close', lang: 'العربية', free: 'Free shipping over $75', cont: 'Continue shopping', items: 'items' },
    ar: { all: 'الكل', search: 'ابحث عن منتج…', sort: 'الترتيب', featured: 'المميزة', low: 'السعر: من الأقل', high: 'السعر: من الأعلى', az: 'الاسم', add: 'أضف إلى السلة', added: 'تمت الإضافة إلى السلة', cart: 'سلتك', empty: 'سلتك فارغة', subtotal: 'المجموع', checkout: 'إتمام الشراء', demo: 'متجر تجريبي: الدفع غير مفعّل.', results: 'منتج', none: 'لا توجد منتجات', remove: 'حذف', shipping: 'الشحن والضرائب تُحتسب عند الدفع.', view: 'عرض سريع', new: 'جديد', sale: 'تخفيض', close: 'إغلاق', lang: 'English', free: 'شحن مجاني فوق 75$', cont: 'متابعة التسوق', items: 'منتجات' },
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var S = { lang: 'en', cat: 'all', q: '', sort: 'featured', cart: {}, opts: {}, imgBase: '../shared/img/' };

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function t(k) { return UI[S.lang][k] || k; }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pname(p) { return p[S.lang][0]; }
  function pdesc(p) { return p[S.lang][1]; }
  function byId(id) { return window.PRODUCTS.filter(function (p) { return p.id === +id; })[0]; }

  function list() {
    var q = S.q.trim().toLowerCase();
    var r = window.PRODUCTS.filter(function (p) {
      if (S.cat !== 'all' && p.cat !== S.cat) return false;
      if (!q) return true;
      return (p.en[0] + ' ' + p.ar[0] + ' ' + p.en[1]).toLowerCase().indexOf(q) > -1;
    });
    if (S.sort === 'low') r.sort(function (a, b) { return a.price - b.price; });
    if (S.sort === 'high') r.sort(function (a, b) { return b.price - a.price; });
    if (S.sort === 'az') r.sort(function (a, b) { return pname(a).localeCompare(pname(b), S.lang); });
    return r;
  }

  function card(p) {
    var badge = p.badge ? '<span class="badge badge-' + p.badge + '">' + esc(t(p.badge)) + '</span>' : '';
    return '<article class="card" data-id="' + p.id + '">' +
      '<button class="thumb" data-open="' + p.id + '" aria-label="' + esc(pname(p)) + '"><img loading="lazy" src="' + S.imgBase + p.img + '.jpg" alt="' + esc(pname(p)) + '">' + badge + '<span class="qv">' + esc(t('view')) + '</span></button>' +
      '<div class="meta"><span class="cat">' + esc(window.CATS[p.cat][S.lang]) + '</span><h3>' + esc(pname(p)) + '</h3>' +
      '<div class="row"><span class="price">' + money(p.price) + '</span><button class="add" data-add="' + p.id + '" aria-label="' + esc(t('add')) + '"><span>' + esc(t('add')) + '</span></button></div></div></article>';
  }

  function renderFilters() {
    var el = $('#filters'); if (!el) return;
    var h = '<button class="chip' + (S.cat === 'all' ? ' on' : '') + '" data-cat="all">' + esc(t('all')) + '</button>';
    Object.keys(window.CATS).forEach(function (k) { h += '<button class="chip' + (S.cat === k ? ' on' : '') + '" data-cat="' + k + '">' + esc(window.CATS[k][S.lang]) + '</button>'; });
    el.innerHTML = h;
  }

  function renderGrid() {
    var g = $('#grid'); if (!g) return;
    var r = list();
    g.innerHTML = r.length ? r.map(card).join('') : '<p class="none">' + esc(t('none')) + '</p>';
    var c = $('#count'); if (c) c.textContent = r.length + ' ' + t('results');
    var f = $('#featured');
    if (f) f.innerHTML = window.PRODUCTS.filter(function (p) { return p.badge === 'new' || p.badge === 'sale' || p.id === 1 || p.id === 11; }).slice(0, 8).map(card).join('');
  }

  function cartLines() { return Object.keys(S.cart).map(function (id) { return { p: byId(id), q: S.cart[id] }; }).filter(function (x) { return x.p; }); }
  function renderCart() {
    var ls = cartLines(), n = 0, tot = 0;
    ls.forEach(function (l) { n += l.q; tot += l.q * l.p.price; });
    $$('[data-cart-count]').forEach(function (e) { e.textContent = n; e.hidden = !n; });
    var it = $('#drawer-items');
    if (it) it.innerHTML = ls.length ? ls.map(function (l) {
      return '<div class="line"><img src="' + S.imgBase + l.p.img + '.jpg" alt=""><div class="li"><b>' + esc(pname(l.p)) + '</b><span>' + money(l.p.price) + '</span>' +
        '<div class="qty"><button data-dec="' + l.p.id + '" aria-label="-">−</button><i>' + l.q + '</i><button data-inc="' + l.p.id + '" aria-label="+">+</button></div></div>' +
        '<button class="rm" data-rm="' + l.p.id + '" aria-label="' + esc(t('remove')) + '">×</button></div>';
    }).join('') : '<p class="none">' + esc(t('empty')) + '</p>';
    var tt = $('#drawer-total'); if (tt) tt.textContent = money(tot);
    var ck = $('#checkout'); if (ck) ck.disabled = !ls.length;
    store('bv_cart', S.cart);
  }

  function toast(msg) {
    var e = $('#toast'); if (!e) return; e.textContent = msg; e.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('show'); }, 1800);
  }
  function add(id, n) { S.cart[id] = (S.cart[id] || 0) + (n || 1); renderCart(); toast(t('added')); }

  function openModal(id) {
    var p = byId(id), m = $('#modal'); if (!p || !m) return;
    $('#modal-body').innerHTML = '<div class="mimg"><img src="' + S.imgBase + p.img + '.jpg" alt="' + esc(pname(p)) + '"></div><div class="minfo"><span class="cat">' + esc(window.CATS[p.cat][S.lang]) + '</span><h2>' + esc(pname(p)) + '</h2><p class="mprice">' + money(p.price) + '</p><p>' + esc(pdesc(p)) + '</p><button class="btn" data-add="' + p.id + '">' + esc(t('add')) + '</button><p class="mnote">' + esc(t('free')) + '</p></div>';
    m.classList.add('open'); document.body.classList.add('lock');
  }
  function closeAll() { $$('.open').forEach(function (e) { e.classList.remove('open'); }); document.body.classList.remove('lock'); }

  function applyLang() {
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    $$('[data-tx]').forEach(function (e) { var k = e.getAttribute('data-tx'); var v = S.opts.text && S.opts.text[S.lang] && S.opts.text[S.lang][k]; if (v) e.textContent = v; });
    $$('[data-lang-toggle]').forEach(function (e) { e.textContent = t('lang'); });
    var s = $('#search'); if (s) s.placeholder = t('search');
    var so = $('#sort'); if (so) { so.innerHTML = ['featured', 'low', 'high', 'az'].map(function (k) { return '<option value="' + k + '"' + (S.sort === k ? ' selected' : '') + '>' + esc(t(k)) + '</option>'; }).join(''); }
    store('bv_lang_' + S.opts.id, S.lang);
    renderFilters(); renderGrid(); renderCart();
  }

  function bind() {
    document.addEventListener('click', function (ev) {
      var e = ev.target.closest('[data-add],[data-open],[data-cat],[data-inc],[data-dec],[data-rm],[data-cart-open],[data-close],[data-lang-toggle],#checkout');
      if (!e) return;
      if (e.hasAttribute('data-add')) { add(e.getAttribute('data-add')); }
      else if (e.hasAttribute('data-open')) openModal(e.getAttribute('data-open'));
      else if (e.hasAttribute('data-cat')) { S.cat = e.getAttribute('data-cat'); renderFilters(); renderGrid(); var g = $('#shop'); if (g && ev.isTrusted) g.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (e.hasAttribute('data-inc')) { S.cart[e.getAttribute('data-inc')]++; renderCart(); }
      else if (e.hasAttribute('data-dec')) { var i = e.getAttribute('data-dec'); S.cart[i]--; if (S.cart[i] <= 0) delete S.cart[i]; renderCart(); }
      else if (e.hasAttribute('data-rm')) { delete S.cart[e.getAttribute('data-rm')]; renderCart(); }
      else if (e.hasAttribute('data-cart-open')) { $('#drawer').classList.add('open'); document.body.classList.add('lock'); }
      else if (e.hasAttribute('data-close')) closeAll();
      else if (e.hasAttribute('data-lang-toggle')) { S.lang = S.lang === 'en' ? 'ar' : 'en'; applyLang(); }
      else if (e.id === 'checkout') toast(t('demo'));
    });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeAll(); });
    var s = $('#search'); if (s) s.addEventListener('input', function () { S.q = s.value; renderGrid(); });
    var so = $('#sort'); if (so) so.addEventListener('change', function () { S.sort = so.value; renderGrid(); });
  }

  window.Store = {
    init: function (opts) {
      S.opts = opts || {}; if (S.opts.imgBase) S.imgBase = S.opts.imgBase; S.lang = store('bv_lang_' + S.opts.id) || S.opts.lang || 'en';
      S.cart = store('bv_cart') || {};
      bind(); applyLang();
    },
  };
})();
