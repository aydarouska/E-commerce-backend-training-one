const { body } = require("express-validator");

// التحقق من الاعدادات قبل الحفظ
const updateSettingsValidator = [
  // سعر الدولار لازم اكبر من صفر
  body("usdRate").optional().isFloat({ gt: 0 }).withMessage("Exchange rate must be greater than 0"),
  // الشحن مينفعش يبقى بالسالب
  body("shippingFee").optional().isFloat({ min: 0 }).withMessage("Shipping fee can't be negative"),
  // حد الشحن المجانى مينفعش يبقى بالسالب
  body("freeShippingThreshold")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Free shipping threshold can't be negative"),

  // مفاتيح Paymob (كلها اختياريه - الفاضى بيتجاهل)
  body("paymob.secretKey")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^egy_sk_\S{10,300}$/)
    .withMessage("Paymob secret key must start with egy_sk_"),
  body("paymob.publicKey")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^egy_pk_\S{10,300}$/)
    .withMessage("Paymob public key must start with egy_pk_"),
  body("paymob.hmacSecret")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^\S{10,200}$/)
    .withMessage("Paymob HMAC secret looks invalid"),
  body("paymob.cardIntegrationId")
    .optional({ values: "falsy" })
    .trim()
    .isInt({ min: 1 })
    .withMessage("Card integration ID must be a number"),
  body("paymob.walletIntegrationId")
    .optional({ values: "falsy" })
    .trim()
    .isInt({ min: 1 })
    .withMessage("Wallet integration ID must be a number"),
];

module.exports = { updateSettingsValidator };
