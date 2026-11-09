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
           'الرسالة الأولى', 'رسالة المتابعة', 'يحتاج مراجعة لغوية', 'حالة الإرسال', 'تاريخ الإرسال', 'الرد', 'ملاحظات',
           # extra helpful columns
           'التخصص', 'سبب الحاجة (بلغة الرسالة)', 'لقطة ديسكتوب', 'لقطة جوال', 'الشعار في الديمو', 'مصدر المعلومة']

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

TPL = {
    ('ar', 'WhatsApp'): (
        'السلام عليكم، معكم فريق Bytevia لتصميم المواقع. لاحظنا أن {reason}، ويسعدنا أن نساعد {name} في الظهور بصورة احترافية على الإنترنت. هل تحبون أن نريكم تصميمًا جاهزًا لنشاطكم؟',
        'السلام عليكم، نتابع رسالتنا السابقة بخصوص موقع {name}. التصميم جاهز، ويسعدنا إرساله لكم متى ما ناسبكم.'),
    ('ar', 'Instagram'): (
        'مرحبًا {name} 👋 أعجبنا محتوى حسابكم كثيرًا. لاحظنا أن {reason}، فجهّزنا فكرة لموقع خاص بكم. هل تحبون أن نريكم تصميمًا جاهزًا لنشاطكم؟',
        'مرحبًا مجددًا 🙂 تصميم موقع {name} جاهز، هل نرسله لكم هنا؟'),
    ('en', 'WhatsApp'): (
        "Hello, this is the Bytevia web design team. We noticed that {reason}, and we'd love to help {name} look as professional online as it is in person. Would you like us to show you a ready-made design for your business?",
        'Hello again, just following up on our message about a website for {name}. The design is ready and we would be happy to send it whenever suits you.'),
    ('en', 'Instagram'): (
        "Hi {name}! 👋 Really like what you share here. We noticed that {reason}, so we sketched a website concept just for you. Would you like us to show you the ready design?",
        'Hi again! The website concept for {name} is ready, shall we send it over here?'),
    ('nl', 'Instagram'): (
        'Hoi {name}! 👋 Mooi werk op jullie Instagram. Het viel ons op dat {reason}, dus we hebben alvast een websiteontwerp voor jullie uitgewerkt. Zouden jullie het willen zien?',
        'Hoi! Nog even een berichtje: het websiteontwerp voor {name} staat klaar. Zullen we het hier sturen?'),
    ('de', 'Instagram'): (
        'Guten Tag {name}, Ihr Instagram-Auftritt gefällt uns sehr. Uns ist aufgefallen, dass {reason}. Deshalb haben wir bereits einen Website-Entwurf für Sie vorbereitet. Dürfen wir ihn Ihnen zeigen?',
        'Guten Tag, kurz nachgefragt: Der Website-Entwurf für {name} ist fertig. Sollen wir ihn Ihnen hier schicken?'),
    ('fr', 'Instagram'): (
        "Bonjour {name} ! Votre compte Instagram nous plaît beaucoup. Nous avons remarqué que {reason}, alors nous avons préparé une maquette de site web pour vous. Souhaitez-vous la découvrir ?",
        "Bonjour, nous nous permettons de revenir vers vous : la maquette du site de {name} est prête. Voulez-vous que nous vous l'envoyions ici ?"),
    ('da', 'Instagram'): (
        'Hej {name}! 👋 Vi er rigtig glade for jeres Instagram. Vi lagde mærke til, at {reason}, så vi har lavet et udkast til en hjemmeside til jer. Har I lyst til at se det?',
        'Hej igen! Udkastet til jeres hjemmeside er klar. Skal vi sende det her?'),
    ('no', 'Instagram'): (
        'Hei {name}! 👋 Vi liker Instagram-kontoen deres godt. Vi la merke til at {reason}, så vi har laget et utkast til en nettside for dere. Har dere lyst til å se det?',
        'Hei igjen! Utkastet til nettsiden deres er klart. Skal vi sende det her?'),
    ('sv', 'Instagram'): (
        'Hej {name}! 👋 Vi gillar ert Instagramkonto. Vi märkte att {reason}, så vi har tagit fram ett förslag på en webbplats åt er. Vill ni se det?',
        'Hej igen! Förslaget på er webbplats är klart. Ska vi skicka det här?'),
    ('fi', 'Instagram'): (
        'Hei {name}! 👋 Pidämme Instagram-tilistänne. Huomasimme, että {reason}, joten teimme teille valmiin verkkosivuehdotuksen. Haluaisitteko nähdä sen?',
        'Hei taas! Verkkosivuehdotuksenne on valmis. Lähetämmekö sen tänne?'),
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


def messages(row):
    lang = row['message_lang'] if row['message_lang'] in FALLBACK_REASON else 'en'
    ch = 'WhatsApp' if row['channel'].lower().startswith('whats') else 'Instagram'
    tpl = TPL.get((lang, ch)) or TPL.get((lang, 'Instagram'))
    reason = clean_reason(row.get('need_reason_local'), lang) or FALLBACK_REASON[lang]
    name = row['name'].strip()
    first, follow = (t.format(name=name, reason=reason) for t in tpl)
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


def load():
    rows, seen = [], set()
    dups = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'research', 'A*.csv'))):
        with open(f, encoding='utf-8') as fh:
            for r in csv.DictReader(fh):
                if not (r.get('name') or '').strip():
                    continue
                r = {k: (r.get(k) or '').strip() for k in FIELDS}
                r['_slice'] = os.path.basename(f)[:-4]
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
        build.append({'name': r['name'], 'niche': r['niche'], 'city': r['city'], 'lang': r['message_lang'],
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
    out = []
    for i, r in enumerate(rows, 1):
        key = re.sub(r'\s+', ' ', (r['name'] + '|' + r['city']).lower()).strip()
        b = res.get(key, {})
        tok = b.get('token', '')
        url = (f'{base}/d/{tok}/' if base else f'd/{tok}/') if tok else ''
        first, follow, review = messages(r)
        out.append({
            '#': i, 'اسم النشاط': r['name'], 'النيش': NICHE_LABEL.get(r['niche'], r['niche']), 'الدولة': r['country'],
            'المدينة': r['city'], 'القناة': 'WhatsApp' if r['channel'].lower().startswith('whats') else 'Instagram',
            'رقم الواتساب': r['whatsapp'], 'حساب انستغرام': r['instagram'], 'رابط Google Maps': r['maps_url'],
            'رابط الموقع': r['website'], 'سبب الحاجة': r['need_reason_en'], 'درجة الحاجة': r['need_score'],
            'اسم المالك/المسؤول': r['owner_name'], 'اللون/الهوية': r['brand_color'], 'لغة الرسالة': r['message_lang'],
            'رابط الديمو': url, 'الرسالة الأولى': first, 'رسالة المتابعة': follow, 'يحتاج مراجعة لغوية': review,
            'حالة الإرسال': 'لم يُرسل', 'تاريخ الإرسال': '', 'الرد': '', 'ملاحظات': r['notes'],
            'التخصص': r['sub_niche'], 'سبب الحاجة (بلغة الرسالة)': r['need_reason_local'],
            'لقطة ديسكتوب': f'screenshots/{tok}-desktop.jpg' if tok else '', 'لقطة جوال': f'screenshots/{tok}-mobile.jpg' if tok else '',
            'الشعار في الديمو': 'شعار النشاط' if b.get('logo') == 'business logo' else 'شعار مؤقت بالأحرف الأولى (أضف شعارهم)',
            'مصدر المعلومة': r['source_url'],
        })
    with open(os.path.join(ROOT, 'leads.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(out)
    write_xlsx(out)
    print(f'Final: {len(out)} rows -> leads.csv / leads.xlsx ({len(dups)} duplicates removed)')


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
    for col in ('رابط الديمو', 'حساب انستغرام', 'رابط Google Maps', 'رابط الموقع'):
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
