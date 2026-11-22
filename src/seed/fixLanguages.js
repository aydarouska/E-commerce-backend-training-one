require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");

// تم الاضافه: سكريبت تظبيط لغه المنتجات القديمه
// فى 15 منتج قديم (من اول المشروع) متسجلين بالانجليزى فى خانات العربى و خانات الانجليزى فاضيه
// فكانوا بيظهروا بالانجليزى و الموقع عربى - و تصنيفاتهم (Clothing و Electronics...) بتظهر فى شريط التصنيفات
// السكريبت ده بينقل الكلام الانجليزى لخانات الانجليزى و بيحط الترجمه العربى مكانه
// و بيحط كل منتج فى تصنيف عربى موجود اصلا (زى المطبخ و رياضه)
// التشغيل: npm run fix:languages
// مش بيمسح حاجه - و لو شغلته تانى مش هيعمل حاجه (بيدور على المنتجات اللى لسه بالانجليزى بس)

// التصنيفات: [العربى, الانجليزى]
const CAT = {
  men: ["أزياء رجالي", "Men's Fashion"],
  shoes: ["أحذية", "Shoes"],
  audio: ["سماعات وإكسسوارات", "Audio & Accessories"],
  watches: ["ساعات", "Watches"],
  electronics: ["إلكترونيات", "Electronics"],
  kitchen: ["المطبخ", "Kitchen"],
  decor: ["أثاث وديكور", "Furniture & Decor"],
  sports: ["رياضة", "Sports"],
};

// كل منتج: الاسم الانجليزى الحالى -> الاسم و الوصف بالعربى + التصنيف
const FIXES = [
  {
    match: "Cotton Crew Neck T-Shirt (3-Pack)",
    name: "تيشيرت قطن رقبة دائرية (3 قطع)",
    description: "تلات تيشيرتات قطن 100% ناعمة وبتهوّي، تتغسل في الغسالة ومتاحة بألوان كلاسيك.",
    cat: CAT.men,
  },
  {
    match: "Slim Fit Chino Pants",
    name: "بنطلون تشينو سليم فيت",
    description: "بنطلون تشينو عملي من قماش قطن مطاطي، مريح للشغل وللخروج في الويك إند.",
    cat: CAT.men,
  },
  {
    match: "Men's Classic Denim Jacket",
    name: "جاكيت جينز رجالي كلاسيك",
    description: "جاكيت جينز كلاسيك بقصة مريحة وزراير وجيبين على الصدر، بيمشي مع أي لبس.",
    cat: CAT.men,
  },
  {
    match: "Women's Running Shoes",
    name: "حذاء جري حريمي",
    description: "حذاء جري خفيف بوش شبك بيهوّي ونعل مبطن، معمول للتمرين والجري اليومي.",
    cat: CAT.shoes,
  },
  {
    match: "Wireless Bluetooth Headphones",
    name: "سماعة رأس بلوتوث لاسلكية",
    description: "سماعة رأس لاسلكية بعزل ضوضاء نشط، بطارية لحد 30 ساعة، وتصميم بيتطبق للسفر.",
    cat: CAT.audio,
  },
  {
    match: "Portable Bluetooth Speaker",
    name: "سماعة بلوتوث محمولة",
    description: "سماعة بلوتوث صغيرة ومقاومة للمية، بتشتغل 12 ساعة وصوت البيز فيها قوي بالنسبة لحجمها.",
    cat: CAT.audio,
  },
  {
    match: "Smart Fitness Watch",
    name: "ساعة رياضية ذكية",
    description: "بتتابع نبض القلب والنوم والتمارين، مقاومة للمية، بطارية 7 أيام وإشعارات الموبايل.",
    cat: CAT.watches,
  },
  {
    match: "4K Ultra HD Action Camera",
    name: "كاميرا أكشن 4K ألترا HD",
    description: "كاميرا أكشن ضد المية بتصور فيديو 4K بسرعة 60 فريم، بعدسة واسعة ومعاها طقم تثبيت كامل.",
    cat: CAT.electronics,
  },
  {
    match: "Ceramic Pour-Over Coffee Dripper",
    name: "قمع تقطير قهوة سيراميك",
    description: "قمع تقطير قهوة من السيراميك المزجج يدوي، بيركب على أغلب المجات، وبيطلع قهوة أنضف من الماكينة.",
    cat: CAT.kitchen,
  },
  {
    match: "Automatic Drip Coffee Maker",
    name: "ماكينة قهوة بالتنقيط أوتوماتيك",
    description: "ماكينة قهوة 12 كوباية قابلة للبرمجة، بفلتر يتغسل ويتعاد استخدامه، وقفل تلقائي، وسخان يحافظ على القهوة سخنة.",
    cat: CAT.kitchen,
  },
  {
    match: "Non-Stick Frying Pan Set",
    name: "طقم طاسات تيفال (3 قطع)",
    description: "طقم 3 طاسات تيفال بمقاسات مختلفة، بإيدين مقاومة للحرارة وتوزيع حرارة متساوي.",
    cat: CAT.kitchen,
  },
  {
    match: "Stainless Steel Cookware Set",
    name: "طقم حلل ستانلس ستيل (10 قطع)",
    description: "طقم حلل ستانلس ستيل 10 قطع بغطيان زجاج مقسّى، ينفع في الفرن ويتغسل في غسالة الأطباق.",
    cat: CAT.kitchen,
  },
  {
    match: "Memory Foam Pillow (2-Pack)",
    name: "مخدة ميموري فوم (قطعتين)",
    description: "مخدات ميموري فوم بتاخد شكل الرقبة، بغطا بيهوّي، معمولة عشان تسند الرقبة صح وإنت نايم.",
    cat: CAT.decor,
  },
  {
    match: "Yoga Mat with Carrying Strap",
    name: "مات يوجا مع حزام للشيل",
    description: "مات يوجا سميك 6 مم ضد الانزلاق من الناحيتين، ومعاه حزام عشان تشيله للجيم.",
    cat: CAT.sports,
  },
  {
    match: "Adjustable Dumbbell Set",
    name: "طقم دمبل قابل للتعديل",
    description: "طقم دمبل موفر للمساحة من 2.5 لـ 23 كيلو للدمبل الواحد، بتغير الوزن بلفة واحدة في ثواني.",
    cat: CAT.sports,
  },
];

const fixLanguages = async () => {
  await connectDB();
  let fixed = 0;

  for (const f of FIXES) {
    // بنعدل المنتج بس لو لسه اسمه انجليزى و خانه الاسم الانجليزى فاضيه (عشان التشغيل التانى مايعملش حاجه)
    const product = await Product.findOne({ name: f.match, $or: [{ nameEn: "" }, { nameEn: { $exists: false } }] });
    if (!product) continue;

    // الكلام الانجليزى الحالى بيتنقل لخانات الانجليزى
    const nameEn = product.name;
    const descriptionEn = product.description;

    // updateOne بدل save عشان مانغيرش الـ slug (رابط المنتج يفضل زى ما هو)
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          name: f.name,
          nameEn,
          description: f.description,
          descriptionEn,
          category: f.cat[0],
          categoryEn: f.cat[1],
        },
      }
    );
    fixed++;
  }

  console.log(`اتظبطت لغه ${fixed} منتج (من ${FIXES.length})`);
  await mongoose.disconnect();
};

fixLanguages().catch(async (error) => {
  console.error("حصلت مشكله:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
