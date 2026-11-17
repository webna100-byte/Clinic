#!/usr/bin/env python3
"""Build the private send-queue page from leads.csv -> public/outbox-<token>/index.html
Sections: WhatsApp (click opens WhatsApp with the message) and Instagram (copies the message, opens the profile).
Sent status is stored in the browser (localStorage). Run: python3 template/outbox.py"""
import csv, json, os, re, secrets
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tp = os.path.join(ROOT, 'data', 'outbox_token.txt')
if os.path.exists(tp):
    token = open(tp).read().strip()
else:
    token = secrets.token_urlsafe(9).lower().replace('_', 'x').replace('-', 'y')
    open(tp, 'w').write(token)

rows = list(csv.DictReader(open(os.path.join(ROOT, 'leads.csv'), encoding='utf-8-sig')))
SCORE = {'3': 0, '2': 1, '1': 2}
WEAK = {'ضعيف النشاط': 1}
items = []
for r in rows:
    ch = 'wa' if r['القناة'] == 'WhatsApp' else 'ig'
    wa = re.sub(r'\D', '', r['رقم الواتساب'] or '')
    ig = (r['حساب انستغرام'] or '').strip()
    blocked = r['حالة الإرسال'].startswith('لا تُرسل')
    items.append({
        'id': int(r['#']), 'ch': ch, 'name': r['اسم النشاط'], 'niche': r['النيش'].split(' (')[0], 'sub': r['التخصص'],
        'country': r['الدولة'], 'city': r['المدينة'], 'score': r['درجة الحاجة'], 'lang': r['لغة الرسالة'],
        'wa': wa, 'ig': ig, 'msg1': r['الرسالة الأولى'], 'msg2': r['رسالة المتابعة'],
        'demo': r['رابط الديمو'], 'site': r['رابط الموقع'], 'maps': r['رابط Google Maps'],
        'act': r['نشاط الحساب'], 'hint': r['آخر منشور'], 'note': r['ملاحظات'], 'reason': r['سبب الحاجة'],
        'review': r['يحتاج مراجعة لغوية'] == 'نعم', 'blocked': blocked,
        '_k': (1 if blocked else 0, WEAK.get(r['نشاط الحساب'], 0), SCORE.get(r['درجة الحاجة'], 3)),
    })
items.sort(key=lambda x: (x['ch'], x['_k'], x['id']))
for i in items:
    del i['_k']

html = open(os.path.join(ROOT, 'template', 'outbox.html'), encoding='utf-8').read()
html = html.replace('/*DATA*/[]', json.dumps(items, ensure_ascii=False, separators=(',', ':')))
out = os.path.join(ROOT, 'public', f'outbox-{token}')
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
print(f'{len(items)} leads -> public/outbox-{token}/index.html')
print(f'URL: https://bytevia-demos.pages.dev/outbox-{token}/')
