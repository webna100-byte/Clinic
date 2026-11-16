#!/usr/bin/env python3
"""Merge research/A*.csv -> leads.csv + leads.xlsx with messages, demo links and screenshots.

Usage: python3 template/merge.py            (merge + messages, writes data/leads_build.json)
       node template/build.js --all          (builds demos, writes data/build_result.json)
       python3 template/merge.py --final     (adds demo URLs/screenshots, writes leads.csv/xlsx)
The pipeline script `template/run_all.sh` runs all steps.
"""
import csv, glob, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIELDS = ['name', 'niche', 'sub_niche', 'country', 'city', 'channel', 'whatsapp', 'instagram', 'maps_url', 'website',
          'need_reason_en', 'need_reason_local', 'need_score', 'owner_name', 'brand_color', 'message_lang', 'logo_url',
          'source_url', 'notes']

NICHE_LABEL = {'clinic': 'Clinic (dental/aesthetic/derma)', 'law': 'Law / accounting / consulting', 'home': 'Home services',
               'salon': 'Salon / spa / beauty', 'realestate': 'Real estate', 'gym': 'Gym / fitness studio', 'restaurant': 'Restaurant / cafe'}

COLUMNS = ['#', 'اسم النشاط', 'النيش', 'الدولة', 'المدينة', 'القناة', 'رقم الواتساب', 'حساب انستغرام', 'رابط Google Maps',
           'رابط الموقع', 'سبب الحاجة', 'درجة الحاجة', 'اسم المالك/المسؤول', 'اللون/الهوية', 'لغة الرسالة', 'رابط الديمو',
           'الرسالة الأولى', 'رسالة المتابعة', 'رابط الإرسال', 'يحتاج مراجعة لغوية', 'نشاط الحساب', 'آخر منشور', 'حالة الإرسال', 'تاريخ الإرسال', 'الرد', 'ملاحظات',
           # extra helpful columns
           'التخصص', 'سبب الحاجة (بلغة الرسالة)', 'لقطة ديسكتوب', 'لقطة جوال', 'الشعار في الديمو', 'مصدر المعلومة']

# ---------------- activity verification ----------------
STATUS_AR = {'active': 'نشط', 'stale': 'قديم (غير نشط)', 'unclear': 'غير واضح', 'missing': 'غير موجود'}


def load_verify():
    v = {}
    for f in glob.glob(os.path.join(ROOT, 'research', 'verify_out_*.csv')):
        with open(f, encoding='utf-8') as fh:
            for r in csv.DictReader(fh):
                h = ig_handle(r.get('instagram', ''))
                if h:
                    v[h] = r
    return v


def act_fields(vv):
    """Status + a hint line. Dates aren't visible logged-out, so use followers/posts as a proxy."""
    st = STATUS_AR.get(vv.get('status', ''), vv.get('status', ''))
    def num(x):
        x = (x or '').replace(',', '').strip().upper()
        try:
            return int(float(x[:-1]) * 1000) if x.endswith('K') else int(float(x[:-1]) * 1e6) if x.endswith('M') else int(float(x))
        except ValueError:
            return None
    f, p = num(vv.get('followers')), num(vv.get('posts'))
    hint = f"{vv.get('followers', '?')} متابع · {vv.get('posts', '?')} منشور"
    if vv.get('status') == 'unclear' and ((f is not None and f < 30) or (p is not None and p < 10)):
        st = 'ضعيف النشاط'
    return st, hint


# ---------------- messages ----------------
# reason_local is phrased to follow "I noticed that ..." in each language.
FALLBACK_REASON = {
    'ar': 'حسابكم لا يحتوي على رابط لموقع إلكتروني خاص بكم',
    'en': "there's no website linked on your profile yet",
    'nl': 'jullie nog geen eigen website hebben',
    'de': 'Sie noch keine eigene Website haben',
    'fr': "vous n'avez pas encore de site web",
    'da': 'I endnu ikke har en hjemmeside',
    'no': 'dere ennå ikke har en egen nettside',
    'sv': 'ni ännu inte har en egen webbplats',
    'fi': 'teillä ei vielä ole omia verkkosivuja',
}

# ---- PRICE (edit here only). ~USD 850-900 equivalent, shown in the client's local currency. ----
PRICES = {  # country: (code/symbol, amount, arabic unit)
    'UAE': ('AED', '3,300', 'درهم'), 'Saudi Arabia': ('SAR', '3,400', 'ريال'), 'Qatar': ('QAR', '3,300', 'ريال'),
    'Kuwait': ('KWD', '275', 'دينار'),
    'Netherlands': ('€', '790', ''), 'Germany': ('€', '790', ''), 'Austria': ('€', '790', ''), 'Belgium': ('€', '790', ''),
    'Luxembourg': ('€', '790', ''), 'Finland': ('€', '790', ''), 'Ireland': ('€', '790', ''),
    'Switzerland': ('CHF', '790', ''), 'Denmark': ('DKK', '5,900', ''), 'Norway': ('NOK', '8,900', ''),
    'Sweden': ('SEK', '8,500', ''), 'Australia': ('AUD', '1,390', ''), 'Canada': ('CAD', '1,190', ''),
}


def price_str(country, lang):
    code, amt, ar = PRICES.get(country, ('$', '900', 'دولار'))
    if lang == 'ar':
        return f'{amt} {ar or code}'
    if code == '€':
        return f'€{amt}'
    if code == '$':
        return f'${amt}'
    return f'{code} {amt}'


TPL = {
    ('ar', 'WhatsApp'): (
        'السلام عليكم 👋 معكم Bytevia. لاحظنا أن {reason}. صمّمنا لـ{name} موقعًا احترافيًا جاهزًا، وتنفيذه بـ {price} فقط (دفعة واحدة، بدون اشتراكات). لا نطلب أي مقدّم، تشوفون التصميم أولًا. نرسله لكم؟',
        'السلام عليكم، تصميم موقع {name} جاهز بـ {price} فقط، وبدون أي مقدّم. نرسله لكم؟'),
    ('ar', 'Instagram'): (
        'مرحبًا {name} 👋 معكم Bytevia. لاحظنا أن {reason}. صمّمنا لكم موقعًا احترافيًا جاهزًا، وتنفيذه بـ {price} فقط (دفعة واحدة، بدون اشتراكات). لا نطلب أي مقدّم، تشوفون التصميم أولًا. نرسله لكم؟',
        'مرحبًا مجددًا 🙂 تصميم موقع {name} جاهز بـ {price} فقط، وبدون أي مقدّم. نرسله هنا؟'),
    ('en', 'WhatsApp'): (
        "Hello 👋 This is Bytevia. We noticed that {reason}. We've designed a professional website for {name} and can build it for just {price} (one-time, no subscriptions). No upfront payment: you see the design first. Shall we send it over?",
        'Hello, the website design for {name} is ready for just {price}, with no upfront payment. Shall we send it?'),
    ('en', 'Instagram'): (
        "Hi {name} 👋 Bytevia here. We noticed that {reason}. We've designed a professional website for you and can build it for just {price} (one-time, no subscriptions). No upfront payment: you see the design first. Want to see it?",
        'Hi again 🙂 your website design is ready for just {price}, no upfront payment. Want us to send it here?'),
    ('nl', 'Instagram'): (
        'Hoi {name} 👋 Hier Bytevia. Het viel ons op dat {reason}. We hebben alvast een professioneel websiteontwerp voor jullie gemaakt, uitvoering voor slechts {price} (eenmalig, geen abonnement). Geen aanbetaling: jullie zien eerst het ontwerp. Zullen we het sturen?',
        'Hoi! Het websiteontwerp voor {name} staat klaar voor slechts {price}, zonder aanbetaling. Zullen we het hier sturen?'),
    ('de', 'Instagram'): (
        'Guten Tag {name} 👋 hier Bytevia. Uns ist aufgefallen, dass {reason}. Wir haben bereits einen professionellen Website-Entwurf für Sie erstellt, Umsetzung für nur {price} (einmalig, ohne Abo). Keine Anzahlung: Sie sehen zuerst den Entwurf. Dürfen wir ihn Ihnen schicken?',
        'Guten Tag, der Website-Entwurf für {name} ist fertig, für nur {price} und ohne Anzahlung. Dürfen wir ihn Ihnen hier schicken?'),
    ('fr', 'Instagram'): (
        "Bonjour {name} 👋 Ici Bytevia. Nous avons remarqué que {reason}. Nous avons déjà conçu un site professionnel pour vous, réalisable pour seulement {price} (paiement unique, sans abonnement). Aucun acompte : vous voyez d'abord la maquette. On vous l'envoie ?",
        "Bonjour, la maquette du site de {name} est prête pour seulement {price}, sans acompte. On vous l'envoie ici ?"),
    ('da', 'Instagram'): (
        'Hej {name} 👋 Bytevia her. Vi lagde mærke til, at {reason}. Vi har allerede lavet et professionelt hjemmesideudkast til jer, som kan realiseres for kun {price} (engangsbetaling, intet abonnement). Ingen forudbetaling – I ser først udkastet. Skal vi sende det?',
        'Hej igen! Udkastet til jeres hjemmeside er klar for kun {price}, uden forudbetaling. Skal vi sende det her?'),
    ('no', 'Instagram'): (
        'Hei {name} 👋 Bytevia her. Vi la merke til at {reason}. Vi har allerede laget et profesjonelt nettsideutkast til dere, som kan realiseres for kun {price} (engangsbetaling, uten abonnement). Ingen forskuddsbetaling – dere ser først utkastet. Skal vi sende det?',
        'Hei igjen! Utkastet til nettsiden deres er klart for kun {price}, uten forskuddsbetaling. Skal vi sende det her?'),
    ('sv', 'Instagram'): (
        'Hej {name} 👋 Bytevia här. Vi märkte att {reason}. Vi har redan tagit fram ett professionellt webbplatsförslag åt er, som kan genomföras för bara {price} (engångsbelopp, inget abonnemang). Ingen förskottsbetalning – ni ser förslaget först. Ska vi skicka det?',
        'Hej igen! Förslaget på er webbplats är klart för bara {price}, utan förskottsbetalning. Ska vi skicka det här?'),
    ('fi', 'Instagram'): (
        'Hei {name} 👋 Bytevia tässä. Huomasimme, että {reason}. Olemme jo tehneet teille ammattimaisen verkkosivuehdotuksen, toteutus vain {price} (kertamaksu, ei tilausta). Ei ennakkomaksua – näette ensin luonnoksen. Lähetämmekö sen?',
        'Hei taas! Verkkosivuehdotuksenne on valmis hintaan {price}, ilman ennakkomaksua. Lähetämmekö sen tänne?'),
}
CONFIDENT = {'ar', 'en', 'de', 'nl', 'fr'}  # others flagged for native review


def clean_reason(r, lang):
    r = (r or '').strip().rstrip('.').strip()
    # strip lead-in if the agent included it
    for lead in ['لاحظت أن', 'لاحظنا أن', 'I noticed that', 'Mir ist aufgefallen, dass', 'Het viel me op dat', "J'ai remarqué que",
                 'Jeg lagde mærke til, at', 'Jeg la merke til at', 'Jag märkte att', 'Huomasin, että']:
        if r.lower().startswith(lead.lower()):
            r = r[len(lead):].strip(' ,:')
    if lang not in ('de',) and r[:1].isupper() and lang != 'ar':
        # lower-case first letter for mid-sentence use (keep German nouns/proper nouns)
        if not re.match(r'^[A-Z]{2,}|^Instagram|^Google|^WhatsApp', r):
            r = r[0].lower() + r[1:]
    return r


def send_link(row, first):
    """WhatsApp: wa.me with the message pre-filled. Instagram: opens the DM thread (paste the message)."""
    from urllib.parse import quote
    if row['channel'].lower().startswith('whats') and phone(row.get('whatsapp')):
        return f"https://wa.me/{phone(row['whatsapp'])}?text={quote(first)}"
    h = ig_handle(row.get('instagram'))
    return f'https://ig.me/m/{h}' if h else ''


def messages(row):
    lang = row['message_lang'] if row['message_lang'] in FALLBACK_REASON else 'en'
    ch = 'WhatsApp' if row['channel'].lower().startswith('whats') else 'Instagram'
    tpl = TPL.get((lang, ch)) or TPL.get((lang, 'Instagram'))
    reason = clean_reason(row.get('need_reason_local'), lang) or FALLBACK_REASON[lang]
    name = (row.get('name_ar') if lang == 'ar' and row.get('name_ar') else row['name']).strip()
    pr = price_str(row.get('country', ''), lang)
    first, follow = (t.format(name=name, reason=reason, price=pr) for t in tpl)
    review = 'نعم' if (lang not in CONFIDENT or not row.get('need_reason_local')) else 'لا'
    return first, follow, review


# ---------------- merge ----------------
def norm(s):
    s = unicodedata.normalize('NFKD', s or '').lower()
    return re.sub(r'[^a-z0-9؀-ۿ]+', '', s)


def ig_handle(u):
    m = re.search(r'instagram\.com/([A-Za-z0-9_.]+)', u or '')
    return m.group(1).lower().strip('.') if m else ''


def phone(p):
    return re.sub(r'\D', '', p or '')


PREFIX = [('+971', 'UAE'), ('+966', 'Saudi Arabia'), ('+974', 'Qatar'), ('+965', 'Kuwait'), ('+352', 'Luxembourg'),
          ('+358', 'Finland'), ('+31', 'Netherlands'), ('+41', 'Switzerland'), ('+49', 'Germany'), ('+43', 'Austria'),
          ('+45', 'Denmark'), ('+47', 'Norway'), ('+46', 'Sweden'), ('+32', 'Belgium')]
CITY_COUNTRY = {c: 'UAE' for c in ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'al ain', 'fujairah', 'umm al quwain']}
CITY_COUNTRY.update({c: 'Saudi Arabia' for c in ['riyadh', 'jeddah', 'dammam', 'khobar', 'al khobar', 'madinah', 'medina', 'makkah', 'mecca', 'taif', 'abha', 'jubail', 'buraidah']})
CITY_COUNTRY.update({'doha': 'Qatar', 'lusail': 'Qatar', 'al rayyan': 'Qatar', 'al wakrah': 'Qatar', 'kuwait': 'Kuwait', 'kuwait city': 'Kuwait',
                     'hawalli': 'Kuwait', 'salmiya': 'Kuwait', 'farwaniya': 'Kuwait', 'jahra': 'Kuwait'})
GULF = {'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait'}
ALIASES = {'united arab emirates': 'UAE', 'uae': 'UAE', 'ksa': 'Saudi Arabia', 'saudi': 'Saudi Arabia'}


def fix_row(r):
    """Correct country from phone prefix / city; Gulf rows use ar/en; split bilingual names."""
    c = ALIASES.get(r['country'].lower(), r['country'])
    wa = '+' + phone(r['whatsapp']) if phone(r['whatsapp']) else ''
    by_city = CITY_COUNTRY.get(r['city'].lower())
    by_phone = next((n for pre, n in PREFIX if wa.startswith(pre)), None)
    if by_city:
        c = by_city
    elif by_phone and c in GULF | {'Switzerland', 'Netherlands', 'Germany', 'Austria'} and by_phone != c:
        c = by_phone
    r['country'] = c
    if c in GULF and r['message_lang'] not in ('ar', 'en'):
        r['message_lang'] = 'ar'
    if c in GULF and r['channel'].lower().startswith('whats') is False and r['channel'] != 'Instagram':
        r['channel'] = 'Instagram'
    # "English Name (الاسم العربي)" -> name_en / name_ar
    m = re.match(r'^(.*?)\s*\(([^)]*[\u0600-\u06ff][^)]*)\)\s*$', r['name'])
    if r['niche'] == 'clinic' and re.search(r'cosmetic studio|kosmetik|beauty studio', r['sub_niche'].lower()):
        r['niche'] = 'salon'
    r['name_ar'] = ''
    if m:
        r['name'], r['name_ar'] = m.group(1).strip(), m.group(2).strip()
    elif re.search(r'[\u0600-\u06ff]', r['name']):
        r['name_ar'] = r['name']
    return r


def load():
    rows, seen = [], set()
    dups = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'research', '[AB]*.csv'))):
        with open(f, encoding='utf-8') as fh:
            for r in csv.DictReader(fh):
                if not (r.get('name') or '').strip():
                    continue
                r = {k: (r.get(k) or '').strip() for k in FIELDS}
                r['_slice'] = os.path.basename(f)[:-4]
                r = fix_row(r)
                keys = [k for k in ('ig:' + ig_handle(r['instagram']), 'wa:' + phone(r['whatsapp']),
                                    'nc:' + norm(r['name']) + norm(r['city'])) if len(k) > 4]
                if any(k in seen for k in keys):
                    dups.append(r['name'])
                    continue
                seen.update(keys)
                rows.append(r)
    return rows, dups


def main():
    final = '--final' in sys.argv
    rows, dups = load()
    order = {'3': 0, '2': 1, '1': 2}
    rows.sort(key=lambda r: (order.get(r['need_score'], 3), r['_slice']))
    build = []
    for r in rows:
        build.append({'name': r['name'], 'name_ar': r['name_ar'], 'country': r['country'], 'niche': r['niche'], 'city': r['city'], 'lang': r['message_lang'],
                      'color': r['brand_color'], 'whatsapp': r['whatsapp'], 'instagram': r['instagram'],
                      'maps': f"{r['name']} {r['city']}", 'logo': r['logo_url']})
    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    json.dump(build, open(os.path.join(ROOT, 'data', 'leads_build.json'), 'w'), ensure_ascii=False, indent=1)
    if not final:
        print(f'{len(rows)} unique rows ({len(dups)} duplicates removed). Wrote data/leads_build.json')
        return

    res = json.load(open(os.path.join(ROOT, 'data', 'build_result.json')))
    cfg_p = os.path.join(ROOT, 'template', 'config.json')
    base = (json.load(open(cfg_p)).get('baseUrl', '') if os.path.exists(cfg_p) else '').rstrip('/')

    # APPEND-ONLY: existing rows in leads.csv are kept exactly (numbers + user columns); new leads appended.
    existing = []
    lp = os.path.join(ROOT, 'leads.csv')
    if os.path.exists(lp):
        with open(lp, encoding='utf-8-sig') as fh:
            existing = list(csv.DictReader(fh))
    seen = set()
    for e in existing:
        seen.update(k for k in ('ig:' + ig_handle(e.get('حساب انستغرام')), 'wa:' + phone(e.get('رقم الواتساب')),
                                'nc:' + norm(e.get('اسم النشاط')) + norm(e.get('المدينة'))) if len(k) > 4)
    ver = load_verify()
    out = [{c: e.get(c, '') for c in COLUMNS} for e in existing]
    nxt = max([int(e['#']) for e in existing if str(e.get('#', '')).isdigit()] + [0]) + 1
    for r in rows:
        keys = [k for k in ('ig:' + ig_handle(r['instagram']), 'wa:' + phone(r['whatsapp']),
                            'nc:' + norm(r['name']) + norm(r['city'])) if len(k) > 4]
        if any(k in seen for k in keys):
            continue
        seen.update(keys)
        key = re.sub(r'\s+', ' ', (r['name'] + '|' + r['city']).lower()).strip()
        b = res.get(key, {})
        tok = b.get('token', '')
        if not tok:
            continue  # demo not built yet -> picked up next run
        url = f'{base}/d/{tok}/' if base else f'd/{tok}/'
        first, follow, review = messages(r)
        out.append({
            '#': nxt, 'اسم النشاط': r['name'] + (f" ({r['name_ar']})" if r['name_ar'] and r['name_ar'] != r['name'] else ''), 'النيش': NICHE_LABEL.get(r['niche'], r['niche']), 'الدولة': r['country'],
            'المدينة': r['city'], 'القناة': 'WhatsApp' if r['channel'].lower().startswith('whats') else 'Instagram',
            'رقم الواتساب': r['whatsapp'], 'حساب انستغرام': r['instagram'], 'رابط Google Maps': r['maps_url'],
            'رابط الموقع': r['website'], 'سبب الحاجة': r['need_reason_en'], 'درجة الحاجة': r['need_score'],
            'اسم المالك/المسؤول': r['owner_name'], 'اللون/الهوية': r['brand_color'], 'لغة الرسالة': r['message_lang'],
            'رابط الديمو': url, 'الرسالة الأولى': first, 'رسالة المتابعة': follow, 'رابط الإرسال': send_link(r, first), 'يحتاج مراجعة لغوية': review,
            'حالة الإرسال': 'لم يُرسل', 'تاريخ الإرسال': '', 'الرد': '', 'ملاحظات': r['notes'],
            'التخصص': r['sub_niche'], 'سبب الحاجة (بلغة الرسالة)': r['need_reason_local'],
            'لقطة ديسكتوب': f'screenshots/{tok}-desktop.jpg', 'لقطة جوال': f'screenshots/{tok}-mobile.jpg',
            'الشعار في الديمو': 'شعار النشاط' if b.get('logo') == 'business logo' else 'شعار مؤقت بالأحرف الأولى (أضف شعارهم)',
            'مصدر المعلومة': r['source_url'],
        })
        vv = ver.get(ig_handle(r['instagram']))
        if vv:
            out[-1]['نشاط الحساب'], out[-1]['آخر منشور'] = act_fields(vv)
        nxt += 1
    byig = {ig_handle(r['instagram']): r for r in rows if ig_handle(r['instagram'])}
    byph = {phone(r['whatsapp']): r for r in rows if phone(r['whatsapp'])}
    for o in out:
        vv = ver.get(ig_handle(o.get('حساب انستغرام')))
        if vv:
            o['نشاط الحساب'], o['آخر منشور'] = act_fields(vv)
    for o in out[:len(existing)]:
        if o.get('حالة الإرسال', 'لم يُرسل') not in ('', 'لم يُرسل'):
            continue  # already sent: never touch
        src = byig.get(ig_handle(o.get('حساب انستغرام'))) or byph.get(phone(o.get('رقم الواتساب')))
        if src:
            o['الرسالة الأولى'], o['رسالة المتابعة'], o['يحتاج مراجعة لغوية'] = messages(src)
            o['رابط الإرسال'] = send_link(src, o['الرسالة الأولى'])
    for o in out:
        if o.get('نشاط الحساب') == 'غير موجود' and o.get('حالة الإرسال') in ('', 'لم يُرسل', None):
            o['حالة الإرسال'] = 'لا تُرسل (الحساب غير متاح)'
    for o in out:
        for c in COLUMNS:
            o.setdefault(c, '')
    with open(os.path.join(ROOT, 'leads.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(out)
    write_xlsx(out)
    print(f'Final: {len(out)} rows ({len(existing)} kept, {len(out)-len(existing)} new) -> leads.csv / leads.xlsx')


def write_xlsx(out):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.worksheet.datavalidation import DataValidation
    wb = Workbook()
    ws = wb.active
    ws.title = 'Leads'
    ws.sheet_view.rightToLeft = True
    ws.append(COLUMNS)
    for r in out:
        ws.append([r[c] for c in COLUMNS])
    hdr = PatternFill('solid', fgColor='0B1F3A')
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF')
        c.fill = hdr
        c.alignment = Alignment(wrap_text=True, vertical='center')
    widths = {'اسم النشاط': 28, 'الرسالة الأولى': 60, 'رسالة المتابعة': 45, 'سبب الحاجة': 40, 'سبب الحاجة (بلغة الرسالة)': 40,
              'حساب انستغرام': 32, 'رابط Google Maps': 30, 'رابط الديمو': 36, 'ملاحظات': 30, 'مصدر المعلومة': 30}
    from openpyxl.utils import get_column_letter
    for i, c in enumerate(COLUMNS, 1):
        ws.column_dimensions[get_column_letter(i)].width = widths.get(c, 14)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical='top')
    for col in ('رابط الإرسال', 'رابط الديمو', 'حساب انستغرام', 'رابط Google Maps', 'رابط الموقع'):
        j = COLUMNS.index(col) + 1
        for i in range(2, ws.max_row + 1):
            c = ws.cell(i, j)
            if str(c.value or '').startswith('http'):
                c.hyperlink = c.value
                c.font = Font(color='0E7C86', underline='single')
    dv = DataValidation(type='list', formula1='"لم يُرسل,أُرسلت الأولى,أُرسلت المتابعة,رد,مهتم,مغلق"', allow_blank=True)
    ws.add_data_validation(dv)
    j = get_column_letter(COLUMNS.index('حالة الإرسال') + 1)
    dv.add(f'{j}2:{j}{ws.max_row}')
    ws.freeze_panes = 'C2'
    ws.auto_filter.ref = ws.dimensions
    wb.save(os.path.join(ROOT, 'leads.xlsx'))


if __name__ == '__main__':
    main()
