require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Product = require("../models/Product");
const Settings = require("../models/Settings");
const products = require("./products");

// المستخدمين التجريبيين (ادمن + 2 مستخدمين)
const users = [
  { name: "Admin User", email: "admin@test.com", password: "Admin123", role: "admin" },
  { name: "Test User One", email: "user1@test.com", password: "User1123", role: "user" },
  { name: "Test User Two", email: "user2@test.com", password: "User2123", role: "user" },
];

const seed = async () => {
  await connectDB();

  // نمسح المستخدمين التجريبيين القدام لو موجودين
  await User.deleteMany({ email: { $in: users.map((u) => u.email) } });
  // الباسورد بيتشفر تلقائى من الـ pre-save hook فى User model
  await User.create(users);

  // نمسح المنتجات التجريبيه القديمه (اللى بأسماء انجليزى من المحاضرات و الجديده)
  await Product.deleteMany({
    $or: [
      { name: { $in: products.map((p) => p.name) } },
      { name: { $in: products.map((p) => p.nameEn) } },
    ],
  });
  // Product.create مش insertMany عشان الـ pre-save hook بتاع الـ slug يشتغل
  await Product.create(products);

  // بنعمل document الاعدادات بالقيم الافتراضيه لو مش موجود
  // بيانات انستاباى و البنك الحقيقيه بتكتبها من لوحه التحكم > الاعدادات
  await Settings.getSingleton();

  // نطبع البيانات اللى اتعملت
  console.log("Seed data created:");
  users.forEach((u) => console.log(`  - ${u.role.padEnd(5)} ${u.email} / ${u.password}`));
  const categories = [...new Set(products.map((p) => p.categoryEn))];
  console.log(`\n${products.length} products across ${categories.length} categories: ${categories.join(", ")}`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
