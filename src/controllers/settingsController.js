const asyncHandler = require("../utils/asyncHandler");
const Settings = require("../models/Settings");
const paymob = require("../services/paymob");
const { encrypt } = require("../utils/secretBox");

// الاعدادات زى ما العميل يشوفها:
// طريقه الدفع بتظهر بس لو الادمن فعلها - و لو Paymob لازم مفاتيحه تكون موجوده (فى لوحه التحكم او فى .env)
const publicView = async (settings) => {
  const s = settings.toJSON();
  s.payments.card.enabled = s.payments.card.enabled && (await paymob.isConfigured("card", settings));
  s.payments.vodafone_cash.enabled =
    s.payments.vodafone_cash.enabled && (await paymob.isConfigured("vodafone_cash", settings));
  return s;
};

// اللى بيتبعت للادمن: الاعدادات + حاله Paymob + بيانات Paymob الغير سريه
// المفتاح السرى و HMAC عمرهم ما بيتبعتوا - بنبعت بس هل هما محفوظين ولا لا
const adminView = async (settings) => {
  const cfg = await paymob.getConfig(settings);
  const p = settings.paymob || {};
  return {
    settings: settings.toJSON(),
    paymob: {
      card: await paymob.isConfigured("card", settings),
      vodafone_cash: await paymob.isConfigured("vodafone_cash", settings),
    },
    paymobConfig: {
      // القيم اللى الادمن دخلها (لو فاضيه يبقى بنستخدم قيمه .env)
      publicKey: p.publicKey || "",
      cardIntegrationId: p.cardIntegrationId || "",
      walletIntegrationId: p.walletIntegrationId || "",
      // القيم اللى فى .env (بتظهر كتلميح بس)
      envFallback: {
        publicKey: process.env.PAYMOB_PUBLIC_KEY || "",
        cardIntegrationId: process.env.PAYMOB_CARD_INTEGRATION_ID || "",
        walletIntegrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID || "",
      },
      secretKeySet: Boolean(cfg.secretKey),
      hmacSecretSet: Boolean(cfg.hmacSecret),
    },
  };
};

// @route   GET /api/settings
// @access  Public
// اعدادات المتجر للموقع (سعر الدولار - الشحن - طرق الدفع المتاحه و بيانات الحسابات)
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.status(200).json({ success: true, data: { settings: await publicView(settings) } });
});

// @route   GET /api/settings/admin
// @access  Private/Admin
// الاعدادات زى ما هى + هل Paymob متوصل ولا لا (عشان صفحه الاعدادات فى لوحه التحكم)
const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.status(200).json({ success: true, data: await adminView(settings) });
});

// الحقول اللى الادمن مسموحله يعدلها (اى حاجه تانيه بتتجاهل)
const EDITABLE = [
  "storeName",
  "storeNameEn",
  "supportPhone",
  "supportEmail",
  "usdRate",
  "shippingFee",
  "freeShippingThreshold",
];
// الحقول المسموحه جوه كل طريقه دفع
const PAYMENT_FIELDS = {
  card: ["enabled"],
  vodafone_cash: ["enabled"],
  instapay: ["enabled", "address", "accountName", "phone"],
  bank_transfer: ["enabled", "bankName", "accountName", "accountNumber", "iban"],
};

// @route   PUT /api/settings
// @access  Private/Admin
// تعديل الاعدادات
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  // الحقول العاديه
  EDITABLE.forEach((field) => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });

  // حقول طرق الدفع
  const payments = req.body.payments || {};
  Object.entries(PAYMENT_FIELDS).forEach(([method, fields]) => {
    if (!payments[method]) return;
    fields.forEach((f) => {
      if (payments[method][f] !== undefined) settings.payments[method][f] = payments[method][f];
    });
  });

  // مفاتيح Paymob: الحقول العاديه بتتحفظ زى ما هى (الفاضى بيرجعنا لقيمه .env)
  const pm = req.body.paymob || {};
  ["publicKey", "cardIntegrationId", "walletIntegrationId"].forEach((f) => {
    if (typeof pm[f] === "string") settings.paymob[f] = pm[f].trim();
  });
  // الحقول السريه بتتشفر قبل الحفظ - و لو الخانه فاضيه مابنغيرش القيمه المحفوظه
  ["secretKey", "hmacSecret"].forEach((f) => {
    if (typeof pm[f] === "string" && pm[f].trim()) settings.paymob[f] = encrypt(pm[f].trim());
  });

  await settings.save();
  res.status(200).json({ success: true, data: await adminView(settings) });
});

module.exports = { getSettings, getAdminSettings, updateSettings, publicView };
