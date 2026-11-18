/* Sample catalogue for the three Bytevia store concepts. Bilingual (EN/AR), any product type. */
window.CATS = {
  fashion:     { en: 'Fashion',     ar: 'أزياء' },
  accessories: { en: 'Accessories', ar: 'إكسسوارات' },
  home:        { en: 'Home',        ar: 'المنزل' },
  beauty:      { en: 'Beauty',      ar: 'العناية' },
  tech:        { en: 'Tech',        ar: 'إلكترونيات' },
  stationery:  { en: 'Stationery',  ar: 'قرطاسية' },
};
window.PRODUCTS = [
  { id: 1,  cat: 'accessories', price: 129, img: 'handbag',    badge: 'new',  en: ['Structured crossbody bag', 'Soft leather with a magnetic clasp and an adjustable strap.'], ar: ['حقيبة كروس منظمة', 'جلد ناعم مع إغلاق مغناطيسي وحزام قابل للتعديل.'] },
  { id: 2,  cat: 'accessories', price: 89,  img: 'basket',     badge: '',     en: ['Woven top-handle bag', 'Hand-woven texture with a polished leather finish.'], ar: ['حقيبة يد منسوجة', 'ملمس منسوج يدويًا بلمسات جلدية أنيقة.'] },
  { id: 3,  cat: 'accessories', price: 29,  img: 'tote',       badge: '',     en: ['Everyday canvas tote', 'Sturdy and roomy, made for daily errands.'], ar: ['حقيبة قماشية يومية', 'متينة وواسعة، مثالية للاستخدام اليومي.'] },
  { id: 4,  cat: 'accessories', price: 79,  img: 'necklace',   badge: '',     en: ['Pearl strand necklace', 'Classic pearls in a gift-ready presentation box.'], ar: ['عقد لؤلؤ كلاسيكي', 'لؤلؤ أنيق في علبة هدايا جاهزة.'] },
  { id: 5,  cat: 'accessories', price: 249, img: 'ring',       badge: 'new',  en: ['Halo stone ring', 'A delicate setting designed to be worn every day.'], ar: ['خاتم بحجر محاط', 'تصميم رقيق مناسب للارتداء اليومي.'] },
  { id: 6,  cat: 'accessories', price: 59,  img: 'wallet',     badge: '',     en: ['Slim leather wallet', 'Compact bifold with space for cards and notes.'], ar: ['محفظة جلدية رفيعة', 'محفظة مدمجة تتسع للبطاقات والنقود.'] },
  { id: 7,  cat: 'accessories', price: 119, img: 'watch',      badge: '',     en: ['Minimal quartz watch', 'Clean dial and a soft silicone strap.'], ar: ['ساعة كوارتز بسيطة', 'واجهة نظيفة وحزام سيليكون ناعم.'] },
  { id: 8,  cat: 'fashion',     price: 189, img: 'jacket',     badge: '',     en: ['Classic leather jacket', 'A timeless cut that gets better with wear.'], ar: ['جاكيت جلد كلاسيكي', 'قصة خالدة تزداد جمالًا مع الاستخدام.'] },
  { id: 9,  cat: 'fashion',     price: 25,  img: 'tee',        badge: '',     en: ['Organic cotton tee', 'Soft, breathable and cut for an easy fit.'], ar: ['تيشيرت قطن عضوي', 'ناعم وقابل للتنفس بقصة مريحة.'] },
  { id: 10, cat: 'fashion',     price: 99,  img: 'sneakers',   badge: 'sale', en: ['Lightweight sneakers', 'Cushioned sole and breathable knit upper.'], ar: ['حذاء رياضي خفيف', 'نعل مبطّن وجزء علوي منسوج يسمح بالتهوية.'] },
  { id: 11, cat: 'tech',        price: 149, img: 'headphones', badge: '',     en: ['Wireless headphones', 'Rich sound and up to 30 hours of battery.'], ar: ['سماعات لاسلكية', 'صوت غني وبطارية تصل إلى 30 ساعة.'] },
  { id: 12, cat: 'home',        price: 55,  img: 'lamp',       badge: '',     en: ['Adjustable desk lamp', 'Warm light with a flexible arm and a matte finish.'], ar: ['مصباح مكتب قابل للتعديل', 'إضاءة دافئة وذراع مرنة بلمسة مطفية.'] },
  { id: 13, cat: 'home',        price: 45,  img: 'cups',       badge: 'new',  en: ['Stoneware cup set', 'Four hand-glazed cups in speckled cream.'], ar: ['طقم أكواب خزفية', 'أربعة أكواب مطلية يدويًا بلون كريمي منقّط.'] },
  { id: 14, cat: 'home',        price: 65,  img: 'plates',     badge: '',     en: ['Glazed dinner plates', 'Set of four in a calm, layered blue.'], ar: ['أطباق عشاء مطلية', 'طقم من أربع قطع بدرجات زرقاء هادئة.'] },
  { id: 15, cat: 'home',        price: 24,  img: 'candle',     badge: '',     en: ['Soy wax candle', 'Slow-burning with a soft, woody scent.'], ar: ['شمعة شمع الصويا', 'احتراق بطيء ورائحة خشبية ناعمة.'] },
  { id: 16, cat: 'home',        price: 18,  img: 'plant',      badge: '',     en: ['Potted succulent', 'Low-maintenance greenery in a mint ceramic pot.'], ar: ['نبتة صبّار في أصيص', 'خضرة سهلة العناية في أصيص سيراميك بلون النعناع.'] },
  { id: 17, cat: 'stationery',  price: 14,  img: 'notebook',   badge: '',     en: ['Spiral notebook', 'Thick paper that takes ink beautifully.'], ar: ['دفتر حلزوني', 'ورق سميك مثالي للكتابة بالحبر.'] },
  { id: 18, cat: 'beauty',      price: 32,  img: 'cream',      badge: '',     en: ['Hydrating body cream', 'Light formula that absorbs quickly and lasts all day.'], ar: ['كريم مرطب للجسم', 'تركيبة خفيفة تُمتص بسرعة وتدوم طوال اليوم.'] },
  { id: 19, cat: 'beauty',      price: 28,  img: 'mask',       badge: 'sale', en: ['Restorative hair mask', 'Deep conditioning for soft, shiny hair.'], ar: ['ماسك ترميم للشعر', 'ترطيب عميق لشعر ناعم ولامع.'] },
  { id: 20, cat: 'beauty',      price: 26,  img: 'care',       badge: '',     en: ['Daily care duo', 'A cleanser and moisturiser for a simple routine.'], ar: ['ثنائي العناية اليومية', 'غسول ومرطب لروتين بسيط.'] },
  { id: 21, cat: 'home',        price: 16,  img: 'mug',        badge: '',     en: ['Matte ceramic mug', 'A comfortable handle and a soft, matte glaze.'], ar: ['كوب سيراميك مطفي', 'مقبض مريح وطلاء مطفي ناعم.'] },
  { id: 22, cat: 'home',        price: 22,  img: 'tea',        badge: '',     en: ['Tea & biscuit gift set', 'A cup, saucer and handmade biscuits to share.'], ar: ['طقم هدية شاي وبسكويت', 'فنجان وصحن وبسكويت مصنوع يدويًا للمشاركة.'] },
];

/* Department tree for mega menus (decorative sub-levels; clicking a department filters by its top category). */
window.TREE = {
  fashion:     { en: ['Women', 'Men', 'Kids', 'Shoes'], ar: ['نسائي', 'رجالي', 'أطفال', 'أحذية'] },
  accessories: { en: ['Bags', 'Jewellery', 'Watches', 'Wallets'], ar: ['حقائب', 'مجوهرات', 'ساعات', 'محافظ'] },
  home:        { en: ['Kitchen', 'Decor', 'Lighting', 'Gifts'], ar: ['المطبخ', 'ديكور', 'إضاءة', 'هدايا'] },
  beauty:      { en: ['Skincare', 'Hair care', 'Body care', 'Perfume'], ar: ['العناية بالبشرة', 'العناية بالشعر', 'العناية بالجسم', 'عطور'] },
  tech:        { en: ['Audio', 'Phones', 'Smart home', 'Gaming'], ar: ['صوتيات', 'هواتف', 'المنزل الذكي', 'ألعاب'] },
  stationery:  { en: ['Notebooks', 'Pens', 'Art', 'Office'], ar: ['دفاتر', 'أقلام', 'فنون', 'مكتب'] },
};
