const express = require("express");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const userRoutes = require("./userRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const settingsRoutes = require("./settingsRoutes");

const router = express.Router();

// كل مجموعه روابط ليها بدايه: /api/auth - /api/products ...
router.use("/auth", authRoutes); // تسجيل الدخول و الحساب
router.use("/products", productRoutes); // المنتجات
router.use("/users", userRoutes); // اداره المستخدمين (ادمن)
router.use("/cart", cartRoutes); // السله
router.use("/orders", orderRoutes); // الطلبات
router.use("/payments", paymentRoutes); // الدفع (Paymob)
router.use("/settings", settingsRoutes); // اعدادات المتجر

module.exports = router;
