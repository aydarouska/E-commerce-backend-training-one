const { body } = require("express-validator");
const { PAYMENT_METHODS, PAYMENT_STATUSES, ORDER_STATUSES } = require("../models/Order");

// التحقق من بيانات الطلب الجديد قبل ما توصل للكنترولر
const createOrderValidator = [
  // الاسم مطلوب
  body("shippingAddress.fullName").trim().notEmpty().withMessage("Full name is required"),
  // رقم موبايل مصرى: 010 / 011 / 012 / 015 و بعدهم 8 ارقام (و ممكن +20 فى الاول)
  body("shippingAddress.phone")
    .trim()
    .matches(/^(\+?20)?0?1[0125][0-9]{8}$/)
    .withMessage("Please enter a valid Egyptian mobile number"),
  // المحافظه و العنوان مطلوبين
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.address").trim().notEmpty().withMessage("Address is required"),
  // الملاحظات اختياريه و اقصاها 500 حرف
  body("shippingAddress.notes").optional().trim().isLength({ max: 500 }),
  // طريقه الدفع لازم تكون من الطرق المعروفه
  body("paymentMethod").isIn(PAYMENT_METHODS).withMessage("Please choose a payment method"),
];

// التحقق من تعديل الادمن على الطلب
const updateOrderValidator = [
  body("orderStatus").optional().isIn(ORDER_STATUSES).withMessage("Invalid order status"),
  body("paymentStatus").optional().isIn(PAYMENT_STATUSES).withMessage("Invalid payment status"),
  body("adminNote").optional().isString().isLength({ max: 1000 }),
];

module.exports = { createOrderValidator, updateOrderValidator };
