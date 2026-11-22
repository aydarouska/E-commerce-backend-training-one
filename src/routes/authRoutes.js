const express = require("express");
const {
  register,
  login,
  getMe,
  verifyCode,
  resendCode,
  changePhone,
  logout,
} = require("../controllers/authController");
const { registerValidator, loginValidator, changePhoneValidator } = require("../validators/authValidators");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerValidator, validate, register); // تسجيل حساب جديد
router.post("/login", loginValidator, validate, login); // تسجيل الدخول
router.get("/me", protect, getMe); // بيانات المستخدم الحالى
router.post("/logout", protect, logout); // تسجيل الخروج

// تم الاضافه: تأكيد الايميل و الموبايل
router.post("/verify/:channel", protect, verifyCode); // تأكيد بالكود (channel = email او phone)
router.post("/verify/:channel/resend", protect, resendCode); // طلب كود جديد
router.patch("/phone", protect, changePhoneValidator, validate, changePhone); // تعديل رقم الموبايل قبل التأكيد

module.exports = router;
