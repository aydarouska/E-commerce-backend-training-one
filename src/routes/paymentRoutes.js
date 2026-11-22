const express = require("express");
const { startPaymobPayment, paymobWebhook, verifyRedirect } = require("../controllers/paymentController");
const { protect, requireVerified } = require("../middleware/auth");

const router = express.Router();

// Paymob هو اللى بيندهم - مش محتاجين تسجيل دخول لانهم بيتأكدوا بالـ HMAC
router.post("/paymob/webhook", paymobWebhook); // نتيجه الدفع من سيرفر Paymob
router.get("/paymob/verify", verifyRedirect); // التحقق من صفحه الرجوع

// العميل يبدأ الدفع لطلب معين
router.post("/paymob/:orderId", protect, requireVerified, startPaymobPayment);

module.exports = router;
