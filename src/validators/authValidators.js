const { body } = require("express-validator");
const User = require("../models/User");

// تم الاضافه: بيحول رقم الموبايل المصرى للصيغه الدوليه
// مثال: 01012345678 او 201012345678 او +201012345678  ->  +201012345678
const normalizeEgyptPhone = (value = "") => {
  const digits = String(value).replace(/\D/g, ""); // نشيل اى حاجه مش رقم
  if (/^01[0125]\d{8}$/.test(digits)) return `+2${digits}`;
  if (/^201[0125]\d{8}$/.test(digits)) return `+${digits}`;
  return value; // لو مش مطابق بنرجعه زى ما هو و الـ validator هيرفضه
};

// التحقق من رقم الموبايل: مصرى و مش مستخدم فى حساب تانى
const phoneRule = () =>
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .customSanitizer(normalizeEgyptPhone)
    .matches(/^\+201[0125]\d{8}$/)
    .withMessage("Please enter a valid Egyptian mobile number")
    .custom(async (phone) => {
      if (await User.findOne({ phone })) throw new Error("Phone number is already registered");
      return true;
    });

// تم تعديلها: شروط التسجيل الجديده
const registerValidator = [
  // الاسم الاول و التانى (حرفين على الاقل)
  body("firstName").trim().isLength({ min: 2, max: 40 }).withMessage("First name is required"),
  body("lastName").trim().isLength({ min: 2, max: 40 }).withMessage("Last name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email is already registered");
      }
      return true;
    }),
  phoneRule(),
  // اقتراح: باسورد اقوى - 8 حروف على الاقل و فيه حروف و ارقام
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  // اقتراح: تأكيد الباسورد لازم يطابق
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
  // اقتراح: الموافقه على الشروط و سياسه الخصوصيه
  body("acceptTerms")
    .custom((value) => value === true || value === "true")
    .withMessage("You must accept the terms and privacy policy"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// تم الاضافه: تعديل رقم الموبايل
const changePhoneValidator = [phoneRule()];

module.exports = { registerValidator, loginValidator, changePhoneValidator, normalizeEgyptPhone };
