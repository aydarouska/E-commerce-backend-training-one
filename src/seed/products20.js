// تم الاضافه: 20 منتج جديد بصور حقيقيه محفوظه جوه المشروع (مش لينكات API تجربه)
// الصور موجوده فى src/seed/images و السيرفر بيعرضها على الرابط /static/products/<اسم الصوره>
// مصدر الصور: Wikimedia Commons (رخص مفتوحه) - تفاصيل كل صوره و صاحبها فى src/seed/images/CREDITS.md
// الاسعار بالجنيه المصرى (تقريبيه للتجربه - عدلها من لوحه التحكم)

// بيعمل رابط الصوره من اسم الملف
const img = (file) => `/static/products/${file}.jpg`;

module.exports = [
  // ---------------- موبايلات ----------------
  {
    name: "آيفون 17 برو ماكس 256 جيجا - برتقالي كوزميك",
    nameEn: "iPhone 17 Pro Max 256GB - Cosmic Orange",
    description:
      "أحدث وأكبر آيفون من أبل: شاشة 6.9 بوصة Super Retina XDR، معالج A19 Pro، هيكل ألومنيوم بتصميم موحد، وثلاث كاميرات 48 ميجابكسل مع زووم لحد 8x بجودة بصرية. بطارية بتعيش يوم كامل وزيادة.",
    descriptionEn:
      "Apple's biggest, most advanced iPhone: a 6.9-inch Super Retina XDR display, the A19 Pro chip, a unibody aluminium design and three 48MP cameras with up to 8x optical-quality zoom. All-day battery and then some.",
    price: 92999,
    image: img("iphone-17-pro-max"),
    category: "موبايلات",
    categoryEn: "Mobiles",
    brand: "Apple",
    countInStock: 15,
    rating: 4.9,
    numReviews: 214,
    isFeatured: true,
  },
  {
    name: "آيفون 17 برو 256 جيجا",
    nameEn: "iPhone 17 Pro 256GB",
    description:
      "قوة البرو في حجم أصغر: شاشة 6.3 بوصة ProMotion بمعدل 120 هرتز، معالج A19 Pro، ونظام كاميرات احترافي 48 ميجابكسل لتصوير فيديو بجودة سينمائية.",
    descriptionEn:
      "Pro power in a smaller size: a 6.3-inch 120Hz ProMotion display, the A19 Pro chip and a pro 48MP camera system for cinema-grade video.",
    price: 79999,
    image: img("iphone-17-pro"),
    category: "موبايلات",
    categoryEn: "Mobiles",
    brand: "Apple",
    countInStock: 20,
    rating: 4.8,
    numReviews: 167,
    isFeatured: true,
  },
  {
    name: "آيفون إير 256 جيجا",
    nameEn: "iPhone Air 256GB",
    description:
      "أنحف آيفون اتعمل لحد دلوقتي بسمك 5.6 مم بس، بهيكل تيتانيوم خفيف وشاشة 6.5 بوصة. أناقة وخفة من غير ما تتنازل عن الأداء.",
    descriptionEn:
      "The thinnest iPhone ever at just 5.6mm, with a light titanium frame and a 6.5-inch display. Elegant and featherlight without giving up performance.",
    price: 69999,
    image: img("iphone-air"),
    category: "موبايلات",
    categoryEn: "Mobiles",
    brand: "Apple",
    countInStock: 12,
    rating: 4.6,
    numReviews: 88,
    isFeatured: false,
  },
  {
    name: "آيفون 17 128 جيجا - لافندر",
    nameEn: "iPhone 17 128GB - Lavender",
    description:
      "آيفون 17 بشاشة 6.3 بوصة ProMotion لأول مرة في الموديل الأساسي، كاميرا مزدوجة 48 ميجابكسل، وكاميرا أمامية Center Stage لصور سيلفي أوسع.",
    descriptionEn:
      "iPhone 17 brings a 6.3-inch ProMotion display to the standard model for the first time, a dual 48MP camera and a Center Stage front camera for wider selfies.",
    price: 52999,
    image: img("iphone-17"),
    category: "موبايلات",
    categoryEn: "Mobiles",
    brand: "Apple",
    countInStock: 30,
    rating: 4.7,
    numReviews: 132,
    isFeatured: false,
  },
  {
    name: "سامسونج جالاكسي S25 ألترا 512 جيجا",
    nameEn: "Samsung Galaxy S25 Ultra 512GB",
    description:
      "فلاجشيب سامسونج بقلم S Pen مدمج، شاشة 6.9 بوصة Dynamic AMOLED، كاميرا 200 ميجابكسل، ومعالج Snapdragon 8 Elite مع مزايا Galaxy AI.",
    descriptionEn:
      "Samsung's flagship with a built-in S Pen, a 6.9-inch Dynamic AMOLED display, a 200MP camera and the Snapdragon 8 Elite chip with Galaxy AI features.",
    price: 64999,
    image: img("galaxy-s25-ultra"),
    category: "موبايلات",
    categoryEn: "Mobiles",
    brand: "Samsung",
    countInStock: 18,
    rating: 4.7,
    numReviews: 149,
    isFeatured: true,
  },

  // ---------------- لابتوب و تابلت ----------------
  {
    name: "ماك بوك برو 16 بوصة",
    nameEn: "MacBook Pro 16-inch",
    description:
      "لابتوب أبل الاحترافي بشاشة Liquid Retina XDR مقاس 16 بوصة، معالج Apple Silicon للمحترفين، وبطارية بتكفي يوم شغل كامل. مثالي للمونتاج والبرمجة والتصميم.",
    descriptionEn:
      "Apple's pro laptop with a 16-inch Liquid Retina XDR display, pro-grade Apple silicon and battery life that lasts a full workday. Ideal for editing, coding and design.",
    price: 129999,
    image: img("macbook-pro"),
    category: "لابتوب",
    categoryEn: "Laptops",
    brand: "Apple",
    countInStock: 8,
    rating: 4.9,
    numReviews: 76,
    isFeatured: true,
  },
  {
    name: "آيباد برو 11 بوصة (M4)",
    nameEn: "iPad Pro 11-inch (M4)",
    description:
      "أنحف آيباد برو بشاشة Ultra Retina XDR بتقنية OLED مزدوجة، ومعالج M4. بيشتغل مع Apple Pencil Pro وMagic Keyboard عشان يبقى بديل للابتوب.",
    descriptionEn:
      "The thinnest iPad Pro, with a tandem-OLED Ultra Retina XDR display and the M4 chip. Works with Apple Pencil Pro and Magic Keyboard to stand in for a laptop.",
    price: 62999,
    image: img("ipad-pro"),
    category: "تابلت",
    categoryEn: "Tablets",
    brand: "Apple",
    countInStock: 10,
    rating: 4.8,
    numReviews: 64,
    isFeatured: false,
  },

  // ---------------- سماعات و ساعات ----------------
  {
    name: "سماعات أبل إيربودز برو 2",
    nameEn: "Apple AirPods Pro 2",
    description:
      "عزل ضوضاء نشط أقوى بمرتين، وضع الشفافية التكيفي، صوت مكاني مخصص، وعلبة شحن USB-C فيها سماعة صغيرة عشان تلاقيها بسهولة.",
    descriptionEn:
      "Up to 2x stronger active noise cancellation, Adaptive Transparency, personalised Spatial Audio and a USB-C charging case with a built-in speaker so it's easy to find.",
    price: 12999,
    image: img("airpods-pro-2"),
    category: "سماعات وإكسسوارات",
    categoryEn: "Audio & Accessories",
    brand: "Apple",
    countInStock: 40,
    rating: 4.8,
    numReviews: 310,
    isFeatured: true,
  },
  {
    name: "سماعات أبل إيربودز 4",
    nameEn: "Apple AirPods 4",
    description:
      "تصميم مريح جديد بيناسب ودان أكتر، معالج H2، صوت مكاني، وعلبة شحن أصغر بتشحن USB-C. خفيفة ومناسبة للاستخدام اليومي.",
    descriptionEn:
      "A redesigned, more comfortable fit, the H2 chip, Spatial Audio and a smaller USB-C charging case. Light and perfect for everyday use.",
    price: 7999,
    image: img("airpods-4"),
    category: "سماعات وإكسسوارات",
    categoryEn: "Audio & Accessories",
    brand: "Apple",
    countInStock: 50,
    rating: 4.6,
    numReviews: 185,
    isFeatured: false,
  },
  {
    name: "سماعات أبل إيربودز ماكس",
    nameEn: "Apple AirPods Max",
    description:
      "سماعة رأس فاخرة بإطار ستانلس ستيل ووسائد ميموري فوم، عزل ضوضاء نشط، وصوت عالي الدقة بسماعات ديناميكية مصممة من أبل.",
    descriptionEn:
      "Premium over-ear headphones with a stainless-steel frame and memory-foam cushions, active noise cancellation and high-fidelity sound from Apple-designed drivers.",
    price: 29999,
    image: img("airpods-max"),
    category: "سماعات وإكسسوارات",
    categoryEn: "Audio & Accessories",
    brand: "Apple",
    countInStock: 14,
    rating: 4.7,
    numReviews: 97,
    isFeatured: false,
  },
  {
    name: "ساعة أبل ووتش ألترا 2 تيتانيوم",
    nameEn: "Apple Watch Ultra 2 Titanium",
    description:
      "أقوى ساعة من أبل بهيكل تيتانيوم 49 مم، شاشة أسطع لحد 3000 شمعة، GPS مزدوج الدقة، ومقاومة للمياه لعمق 100 متر. بطارية لحد 36 ساعة.",
    descriptionEn:
      "Apple's most rugged watch: a 49mm titanium case, a display up to 3000 nits, precision dual-frequency GPS and water resistance to 100m. Up to 36 hours of battery.",
    price: 44999,
    image: img("apple-watch-ultra-2"),
    category: "ساعات",
    categoryEn: "Watches",
    brand: "Apple",
    countInStock: 9,
    rating: 4.8,
    numReviews: 71,
    isFeatured: true,
  },

  // ---------------- العاب ----------------
  {
    name: "بلايستيشن 5 مع دراع DualSense",
    nameEn: "PlayStation 5 with DualSense Controller",
    description:
      "جهاز سوني الأشهر بقرص SSD فائق السرعة، ألعاب بدقة 4K، ودراع DualSense باهتزاز دقيق ومقاومة في الزناد بتحسسك باللعبة.",
    descriptionEn:
      "Sony's hit console with an ultra-fast SSD, 4K gaming and the DualSense controller, whose haptic feedback and adaptive triggers pull you into every game.",
    price: 29999,
    image: img("ps5"),
    category: "ألعاب فيديو",
    categoryEn: "Gaming",
    brand: "Sony",
    countInStock: 11,
    rating: 4.9,
    numReviews: 260,
    isFeatured: true,
  },

  // ---------------- أحذية ----------------
  {
    name: "حذاء نايك دانك لو باندا",
    nameEn: "Nike Dunk Low 'Panda'",
    description:
      "الكوتشي الأشهر بألوانه الأبيض والأسود الكلاسيك، جلد طبيعي ونعل مطاطي مريح. بيمشي مع أي لبس كاجوال.",
    descriptionEn:
      "The iconic black-and-white sneaker in genuine leather with a comfortable rubber sole. Goes with any casual outfit.",
    price: 6499,
    image: img("nike-dunk-low-panda"),
    category: "أحذية",
    categoryEn: "Shoes",
    brand: "Nike",
    countInStock: 25,
    rating: 4.7,
    numReviews: 143,
    isFeatured: true,
  },
  {
    name: "حذاء نايك إير فورس 1 أبيض",
    nameEn: "Nike Air Force 1 '07 White",
    description:
      "أيقونة الشارع من 1982: جلد أبيض بالكامل، وسادة Nike Air في النعل لراحة طول اليوم، وتصميم كلاسيك عمره ما بيقدم.",
    descriptionEn:
      "A street icon since 1982: all-white leather, Nike Air cushioning for all-day comfort and a classic design that never gets old.",
    price: 5499,
    image: img("nike-air-force-1"),
    category: "أحذية",
    categoryEn: "Shoes",
    brand: "Nike",
    countInStock: 30,
    rating: 4.8,
    numReviews: 201,
    isFeatured: false,
  },
  {
    name: "حذاء أديداس سامبا OG",
    nameEn: "Adidas Samba OG",
    description:
      "الموديل اللي رجع يكسر الدنيا: جلد ناعم مع شمواه، الخطوط التلاتة المميزة، ونعل مطاط جم. خفيف وأنيق.",
    descriptionEn:
      "The comeback classic: soft leather with suede overlays, the signature Three Stripes and a gum rubber sole. Light and stylish.",
    price: 5799,
    image: img("adidas-samba-og"),
    category: "أحذية",
    categoryEn: "Shoes",
    brand: "Adidas",
    countInStock: 22,
    rating: 4.7,
    numReviews: 118,
    isFeatured: false,
  },
  {
    name: "حذاء بوما سويد كلاسيك",
    nameEn: "Puma Suede Classic",
    description:
      "كوتشي بوما الأسطوري من خامة الشمواه الناعمة، بشريط بوما الجانبي ونعل مطاطي متين. راحة وستايل من الستينات لحد النهارده.",
    descriptionEn:
      "Puma's legendary sneaker in soft suede with the side Formstrip and a durable rubber sole. Comfort and style since the sixties.",
    price: 3999,
    image: img("puma-suede"),
    category: "أحذية",
    categoryEn: "Shoes",
    brand: "Puma",
    countInStock: 28,
    rating: 4.5,
    numReviews: 76,
    isFeatured: false,
  },

  // ---------------- ملابس ----------------
  {
    name: "تيشيرت نايك جوردان قطن",
    nameEn: "Nike Jordan Cotton T-Shirt",
    description: "تيشيرت قطن ناعم بقصة مريحة وطبعة جوردان المميزة من نايك. مناسب للجيم والخروج، ومتاح بكل المقاسات.",
    descriptionEn: "A soft cotton tee with a relaxed fit and Nike's signature Jordan print. Great for the gym or going out, in all sizes.",
    price: 1499,
    image: img("nike-tshirt"),
    category: "أزياء رجالي",
    categoryEn: "Men's Fashion",
    brand: "Nike",
    countInStock: 60,
    rating: 4.4,
    numReviews: 92,
    isFeatured: false,
  },

  // ---------------- عطور ----------------
  {
    name: "عطر شانيل N°5 بارفان",
    nameEn: "Chanel N°5 Parfum",
    description:
      "العطر النسائي الأشهر في التاريخ: باقة زهور الياسمين والورد مع لمسة ألدهيدات منعشة. فخامة كلاسيكية بتدوم طول اليوم.",
    descriptionEn:
      "The most famous women's fragrance in history: a floral bouquet of jasmine and rose with sparkling aldehydes. Classic luxury that lasts all day.",
    price: 11999,
    image: img("chanel-no5"),
    category: "عطور",
    categoryEn: "Fragrances",
    brand: "Chanel",
    countInStock: 16,
    rating: 4.8,
    numReviews: 129,
    isFeatured: false,
  },
  {
    name: "عطر ديور سوفاج أو دو تواليت 100 مل",
    nameEn: "Dior Sauvage Eau de Toilette 100ml",
    description:
      "عطر رجالي منعش وجريء بنوتات البرغموت الكالابري والفلفل، مع قاعدة أمبروكسان دافية. من أكتر العطور مبيعًا في العالم.",
    descriptionEn:
      "A fresh, bold men's fragrance with Calabrian bergamot and pepper over a warm Ambroxan base. One of the world's best-selling scents.",
    price: 8499,
    image: img("dior-sauvage"),
    category: "عطور",
    categoryEn: "Fragrances",
    brand: "Dior",
    countInStock: 20,
    rating: 4.8,
    numReviews: 176,
    isFeatured: true,
  },

  // ---------------- شنط ----------------
  {
    name: "حقيبة برادا جلد طبيعي - إصدار فينتاج",
    nameEn: "Prada Leather Handbag - Vintage Edition",
    description:
      "حقيبة يد برادا كلاسيكية من الجلد الطبيعي بنقوش يدوية مذهبة. قطعة مميزة لمحبي الفخامة والتصميمات الفينتاج.",
    descriptionEn:
      "A classic Prada handbag in genuine leather with hand-tooled gilded details. A standout piece for lovers of luxury and vintage design.",
    price: 69999,
    image: img("prada-handbag"),
    category: "شنط",
    categoryEn: "Bags",
    brand: "Prada",
    countInStock: 3,
    rating: 4.6,
    numReviews: 21,
    isFeatured: false,
  },
];
