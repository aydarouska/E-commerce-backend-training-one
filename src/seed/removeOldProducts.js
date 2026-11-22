require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// تم الاضافه: مسح الـ 15 منتج التجريبى القدام (اللى كانوا جايين مع كود المحاضرات و صورهم من picsum)
// التشغيل مره واحده: npm run remove:old-products
// تنبيه: المسح نهائى ومينفعش يرجع - بس الطلبات القديمه مش بتتأثر لان الطلب بيحفظ نسخه من بيانات المنتج

// الاسماء الانجليزى للمنتجات دى بالظبط (عشان مانمسحش اى منتج تانى بالغلط)
const OLD_PRODUCTS = [
  "Wireless Bluetooth Headphones",
  "Smart Fitness Watch",
  "Portable Bluetooth Speaker",
  "4K Ultra HD Action Camera",
  "Men's Classic Denim Jacket",
  "Women's Running Shoes",
  "Cotton Crew Neck T-Shirt (3-Pack)",
  "Slim Fit Chino Pants",
  "Stainless Steel Cookware Set",
  "Automatic Drip Coffee Maker",
  "Memory Foam Pillow (2-Pack)",
  "Non-Stick Frying Pan Set",
  "Yoga Mat with Carrying Strap",
  "Adjustable Dumbbell Set",
  "Ceramic Pour-Over Coffee Dripper",
];

const removeOldProducts = async () => {
  await connectDB();

  // بندور عليهم بالاسم الانجليزى سواء كان فى nameEn (بعد الترجمه) او فى name (قبل الترجمه)
  const products = await Product.find(
    { $or: [{ nameEn: { $in: OLD_PRODUCTS } }, { name: { $in: OLD_PRODUCTS } }] },
    "name nameEn"
  );
  const ids = products.map((p) => p._id);

  if (!ids.length) {
    console.log("مفيش منتجات قديمه - اتمسحوا قبل كده");
    return mongoose.disconnect();
  }

  // نشيلهم من سلات المستخدمين الاول (عشان السله ماتبقاش فيها منتج مش موجود)
  await Cart.updateMany({}, { $pull: { items: { product: { $in: ids } } } });
  // و بعدين نمسحهم
  const result = await Product.deleteMany({ _id: { $in: ids } });

  products.forEach((p) => console.log(`  - ${p.name}`));
  console.log(`\nاتمسح ${result.deletedCount} منتج`);
  console.log(`اجمالى المنتجات دلوقتى: ${await Product.countDocuments()}`);
  await mongoose.disconnect();
};

removeOldProducts().catch(async (error) => {
  console.error("حصلت مشكله:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
