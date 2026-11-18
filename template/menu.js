// Sample price lists per niche (EN/AR). Base prices are in AED and converted to the client's local currency.
// Item: [english, arabic, price]  (price: number in AED, or a string such as '2%', or 0 = free)
const MENUS = {
  salon: { from: false, sections: [
    { t: ['Hair', 'الشعر'], i: [['Haircut & blow-dry', 'قص وسشوار', 120], ['Full hair colour', 'صبغة شعر كاملة', 350], ['Balayage / highlights', 'بالياج وهايلايت', 650], ['Keratin treatment', 'علاج كيراتين', 550], ['Event styling', 'تسريحة مناسبات', 250]] },
    { t: ['Nails', 'الأظافر'], i: [['Manicure', 'مانيكير', 70], ['Pedicure', 'باديكير', 90], ['Gel polish', 'تلميع جل', 110], ['Nail art (per nail)', 'رسم على الأظافر (للظفر)', 15]] },
    { t: ['Skin & spa', 'البشرة والسبا'], i: [['Deep-cleansing facial', 'تنظيف بشرة عميق', 220], ['Moroccan bath', 'حمام مغربي', 280], ['Relaxing massage (60 min)', 'مساج استرخاء (60 دقيقة)', 260], ['Brows & lashes', 'حواجب ورموش', 60]] },
    { t: ['Packages', 'الباقات'], i: [['Bridal package', 'باقة العروس', 1800], ['Glow day: hair, nails & facial', 'يوم التألق: شعر وأظافر وبشرة', 650]] },
  ] },
  home: { from: true, sections: [
    { t: ['Air conditioning', 'التكييف'], i: [['AC servicing & cleaning', 'صيانة وتنظيف مكيف', 150], ['AC gas refill', 'تعبئة فريون', 220], ['Split AC installation', 'تركيب مكيف سبليت', 350], ['Duct cleaning', 'تنظيف مجاري الهواء', 450]] },
    { t: ['Plumbing & electrical', 'السباكة والكهرباء'], i: [['Leak repair', 'إصلاح تسريب', 120], ['Water heater repair', 'إصلاح سخان', 150], ['Fixture installation', 'تركيب وحدات', 100], ['Electrical fault finding', 'فحص وإصلاح أعطال الكهرباء', 130]] },
    { t: ['Cleaning & moving', 'التنظيف والنقل'], i: [['Deep home cleaning', 'تنظيف عميق للمنزل', 350], ['Sofa & mattress cleaning', 'تنظيف كنب ومراتب', 200], ['Moving (studio / 1 bedroom)', 'نقل أثاث (استوديو / غرفة)', 450], ['Handyman, per hour', 'فني متعدد المهام بالساعة', 80]] },
    { t: ['Contracts', 'العقود'], i: [['Annual AC contract (4 visits)', 'عقد سنوي للمكيفات (4 زيارات)', 480], ['Villa maintenance contract', 'عقد صيانة فيلا', 1500]] },
  ] },
  clinic: { from: true, sections: [
    { t: ['Dental', 'الأسنان'], i: [['Check-up & cleaning', 'فحص وتنظيف', 250], ['Teeth whitening', 'تبييض الأسنان', 900], ['Filling', 'حشوة', 350], ['Veneer (per tooth)', 'فينير (للسن)', 1500], ['Dental implant', 'زراعة سن', 3500]] },
    { t: ['Aesthetics', 'التجميل'], i: [['Botox (per area)', 'بوتوكس (للمنطقة)', 900], ['Dermal filler', 'فيلر', 1200], ['Hydrafacial', 'هيدرافيشيال', 450], ['Laser hair removal (area)', 'ليزر إزالة الشعر (للمنطقة)', 300]] },
    { t: ['Consultation', 'الاستشارة'], i: [['First consultation', 'استشارة أولى', 150], ['Follow-up visit', 'زيارة متابعة', 100]] },
  ] },
  law: { from: true, sections: [
    { t: ['Advice', 'الاستشارات'], i: [['Consultation (30 min)', 'استشارة (30 دقيقة)', 300], ['Contract review', 'مراجعة عقد', 800], ['Contract drafting', 'صياغة عقد', 1500]] },
    { t: ['Business', 'الأعمال'], i: [['Company setup', 'تأسيس شركة', 4500], ['Monthly bookkeeping', 'مسك دفاتر شهري', 800], ['VAT filing', 'إقرار ضريبة القيمة المضافة', 400]] },
    { t: ['Disputes', 'النزاعات'], i: [['Demand letter', 'إنذار قانوني', 600], ['Court representation', 'تمثيل أمام القضاء', 3000]] },
  ] },
  realestate: { from: false, sections: [
    { t: ['Selling', 'البيع'], i: [['Property valuation', 'تقييم العقار', 0], ['Professional photography', 'تصوير احترافي', 500], ['Sale commission', 'عمولة البيع', '2%']] },
    { t: ['Renting', 'التأجير'], i: [['Tenant placement', 'إيجاد مستأجر', '5%'], ['Property management (monthly)', 'إدارة العقار (شهريًا)', '5%'], ['Tenancy contract', 'عقد إيجار', 300]] },
  ] },
  gym: { from: false, sections: [
    { t: ['Memberships', 'الاشتراكات'], i: [['Monthly', 'شهري', 350], ['3 months', '3 أشهر', 900], ['Annual', 'سنوي', 3000]] },
    { t: ['Personal training', 'التدريب الشخصي'], i: [['Single session', 'جلسة فردية', 250], ['10 sessions', '10 جلسات', 2200]] },
    { t: ['Classes', 'الحصص'], i: [['Drop-in class', 'حصة مفردة', 60], ['Class pack (10)', 'باقة 10 حصص', 450], ['Nutrition plan', 'خطة تغذية', 300]] },
  ] },
  restaurant: { from: false, sections: [
    { t: ['Breakfast', 'الفطور'], i: [['Shakshuka', 'شكشوكة', 38], ['Pancakes', 'بان كيك', 42], ['Avocado toast', 'توست أفوكادو', 40]] },
    { t: ['Mains', 'الأطباق الرئيسية'], i: [['Grilled chicken plate', 'طبق دجاج مشوي', 62], ['Beef burger', 'برجر لحم', 58], ['Pasta of the day', 'باستا اليوم', 55]] },
    { t: ['Drinks & dessert', 'مشروبات وحلويات'], i: [['Flat white', 'فلات وايت', 18], ['Fresh juice', 'عصير طازج', 22], ['House cake slice', 'قطعة كيك البيت', 28]] },
  ] },
};

// country -> [code, per-AED rate, arabic symbol, rounding step]
const MONEY = {
  'UAE': ['AED', 1, 'د.إ', 5], 'Saudi Arabia': ['SAR', 1.02, 'ر.س', 5], 'Qatar': ['QAR', 0.99, 'ر.ق', 5], 'Kuwait': ['KWD', 0.083, 'د.ك', 0.5],
  'Netherlands': ['€', 0.25, '€', 1], 'Germany': ['€', 0.25, '€', 1], 'Austria': ['€', 0.25, '€', 1], 'Belgium': ['€', 0.25, '€', 1], 'Luxembourg': ['€', 0.25, '€', 1],
  'Finland': ['€', 0.25, '€', 1], 'Ireland': ['€', 0.25, '€', 1], 'Switzerland': ['CHF', 0.24, 'CHF', 1], 'Denmark': ['DKK', 1.85, 'DKK', 5],
  'Norway': ['NOK', 2.9, 'NOK', 10], 'Sweden': ['SEK', 2.8, 'SEK', 10], 'Australia': ['AUD', 0.41, 'AUD', 1], 'Canada': ['CAD', 0.37, 'CAD', 1],
};

function price(p, country, lang, from) {
  const free = { ar: 'مجاني', en: 'Free', nl: 'Gratis', de: 'Gratis', fr: 'Gratuit', da: 'Gratis', no: 'Gratis', sv: 'Gratis', fi: 'Ilmainen' };
  const fr = { ar: 'من', en: 'from', nl: 'vanaf', de: 'ab', fr: 'dès', da: 'fra', no: 'fra', sv: 'från', fi: 'alk.' };
  if (typeof p === 'string') return p;
  if (p === 0) return free[lang] || free.en;
  const [code, rate, arSym, step] = MONEY[country] || ['$', 0.27, '$', 1];
  let v = Math.max(step, Math.round((p * rate) / step) * step);
  const num = Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
  const base = lang === 'ar' ? `${num} ${arSym}` : (code === '€' || code === '$' ? `${code}${num}` : `${code} ${num}`);
  return from ? `${fr[lang] || fr.en} ${base}` : base;
}

module.exports = { MENUS, price };
