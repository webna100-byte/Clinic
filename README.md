# Bytevia — outreach leads + demo generator

## الملفات
| المسار | المحتوى |
|---|---|
| `leads.xlsx` / `leads.csv` | جدول الأنشطة كاملًا مع الرسائل وروابط الديمو |
| `progress.md` | سجل التقدّم (ما أُنجز وما بقي) |
| `research/A*.csv` | البيانات الخام لكل دفعة بحث |
| `template/presets.js` | **ملف الإعدادات الوحيد**: نصوص كل نيش بكل اللغات، الألوان، الصور، الأقسام |
| `template/build.js` | مولّد الديموهات |
| `public/` | الموقع الجاهز للنشر (`public/d/<رمز>/` = ديمو لكل نشاط) |
| `screenshots/` | لقطتان لكل ديمو (ديسكتوب + جوال) |

## توليد ديمو جديد بأمر واحد
```bash
node template/build.js --name "Smile Studio" --niche clinic --city Dubai --lang ar --whatsapp +971501234567 --instagram https://www.instagram.com/smilestudio/ --logo https://example.com/logo.png --color "#0E7C86"
```
- `--niche`: `clinic` | `law` | `home` | `salon` | `realestate` | `gym` | `restaurant`
- `--lang`: `ar` `en` `nl` `de` `fr` `da` `no` `sv` `fi`. كل ديمو يأتي بلغتين: لغة النشاط + الإنجليزية (والعربية تُعرض RTL تلقائيًا).
- `--logo`: رابط أو مسار ملف لشعار النشاط. بدونه يظهر شعار مؤقت بالأحرف الأولى بلون النشاط. لاستبداله لاحقًا: ضع `logo.png` داخل مجلد الديمو `public/d/<رمز>/` ثم أعد تشغيل الأمر.
- الرابط الناتج غير قابل للتخمين (`d/<اسم>-<رمز عشوائي>/`) ومحفوظ في `data/tokens.json`.

إعادة بناء الكل (الدمج، الديموهات، اللقطات، الجدول):
```bash
./template/run_all.sh
```

## النشر
- **Cloudflare Pages (موصى به):** اربط المستودع من لوحة Cloudflare: Workers & Pages ← Create ← Pages ← Connect to Git. اترك Build command فارغًا، واجعل Output directory: `public`. بعدها ضع النطاق في `template/config.json` بهذا الشكل: `{"baseUrl": "https://xxx.pages.dev"}` وشغّل `./template/run_all.sh` لتحديث الروابط في الجدول.
- أو عبر التوكن: `CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... ./deploy.sh`
- **Firebase:** `./deploy.sh firebase <project-id>`

كل الصفحات عليها `noindex` وشريط ثابت: "Design concept prepared for … by Bytevia — not an official website".
الصور من Unsplash (رخصة مجانية للاستخدام التجاري). التقييمات والعقارات وجدول الحصص أمثلة توضيحية ومكتوب عليها ذلك.
