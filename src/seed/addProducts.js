require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Product = require("../models/Product");
const Settings = require("../models/Settings");
const products100 = require("./products100");
// تم الاضافه: 20 منتج جديد بصور محفوظه جوه المشروع (src/seed/images)
const products20 = require("./products20");

// كل المنتجات اللى السكريبت بيضيفها (اللى موجود منها بيتخطاه)
const allProducts = [...products20, ...products100];

// السكريبت ده بيضيف المنتجات (الـ 20 الجداد + الـ 100 التجريبى) من غير ما يمسح اى حاجه موجوده
// التشغيل: npm run seed:products
// لو شغلته اكتر من مره مش هيكرر المنتجات (بيتخطى اى منتج اسمه موجود قبل كده)
const addProducts = async () => {
  await connectDB();

  // اسماء المنتجات الموجوده حاليا فى قاعده البيانات (عربى و انجليزى)
  const existing = await Product.find({}, "name nameEn");
  const existingNames = new Set(existing.flatMap((p) => [p.name, p.nameEn]).filter(Boolean));

  // المنتجات الجديده بس (اللى مش موجوده)
  const toAdd = allProducts.filter((p) => !existingNames.has(p.name) && !existingNames.has(p.nameEn));

  // Product.create مش insertMany عشان الـ slug يتعمل تلقائى لكل منتج
  if (toAdd.length) await Product.create(toAdd);

  // لو مفيش ولا ادمن فى قاعده البيانات نعمل حساب ادمن تجريبى (مش بنمسح اى مستخدم)
  const adminExists = await User.exists({ role: "admin" });
  if (!adminExists) {
    await User.create({ name: "Admin User", email: "admin@test.com", password: "Admin123", role: "admin" });
    console.log("اتعمل حساب ادمن: admin@test.com / Admin123");
  }

  // نتأكد ان اعدادات المتجر موجوده (لو مش موجوده بتتعمل بالقيم الافتراضيه)
  await Settings.getSingleton();

  // مساحه قاعده البيانات المستخدمه بالميجا (الخطه المجانيه فى MongoDB Atlas = 512 ميجا)
  const stats = await mongoose.connection.db.stats();
  const usedMB = ((stats.dataSize + stats.indexSize) / 1024 / 1024).toFixed(2);

  console.log(`اتضاف ${toAdd.length} منتج جديد - و ${allProducts.length - toAdd.length} كانوا موجودين قبل كده`);
  console.log(`اجمالى المنتجات دلوقتى: ${await Product.countDocuments()}`);
  console.log(`المساحه المستخدمه فى قاعده البيانات: ${usedMB} ميجا من 512 ميجا`);

  await mongoose.disconnect();
  process.exit(0);
};

addProducts().catch((error) => {
  console.error("Adding products failed:", error);
  process.exit(1);
});
