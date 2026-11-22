const crypto = require("crypto");
const Settings = require("../models/Settings");
const { decrypt } = require("../utils/secretBox");

// ملف التعامل مع Paymob (بوابه الدفع المصريه) عن طريق Intention API
// الشرح الرسمى: https://developers.paymob.com/paymob-docs/intention-apis/create-intention
//
// القيم المطلوبه فى ملف .env (بتجيبها من لوحه تحكم Paymob):
//   PAYMOB_SECRET_KEY            المفتاح السرى  (Settings > Account Info)
//   PAYMOB_PUBLIC_KEY            المفتاح العام
//   PAYMOB_HMAC_SECRET           مفتاح HMAC (للتأكد ان الرد جاى من Paymob فعلا)
//   PAYMOB_CARD_INTEGRATION_ID   رقم الـ integration الخاص بالدفع بالكارت
//   PAYMOB_WALLET_INTEGRATION_ID رقم الـ integration الخاص بالمحافظ (فودافون كاش ...)

// رابط الـ API و رابط صفحه الدفع لمصر
const API_BASE = process.env.PAYMOB_API_BASE || "https://accept.paymob.com";
const CHECKOUT_BASE = process.env.PAYMOB_CHECKOUT_BASE || "https://eg.checkout.paymob.com";

// بيجيب اعدادات Paymob: القيمه اللى الادمن دخلها من لوحه التحكم (فى قاعده البيانات) بتتفوق
// و لو الخانه فاضيه بنستخدم القيمه اللى فى ملف .env
const getConfig = async (settingsDoc) => {
  const settings = settingsDoc || (await Settings.getSingleton());
  const p = settings.paymob || {};
  const env = process.env;
  return {
    secretKey: decrypt(p.secretKey) || env.PAYMOB_SECRET_KEY || "",
    hmacSecret: decrypt(p.hmacSecret) || env.PAYMOB_HMAC_SECRET || "",
    publicKey: p.publicKey || env.PAYMOB_PUBLIC_KEY || "",
    cardIntegrationId: p.cardIntegrationId || env.PAYMOB_CARD_INTEGRATION_ID || "",
    walletIntegrationId: p.walletIntegrationId || env.PAYMOB_WALLET_INTEGRATION_ID || "",
  };
};

// بيرجع رقم الـ integration المناسب لطريقه الدفع
const integrationIdFor = (cfg, method) => {
  if (method === "card") return cfg.cardIntegrationId;
  if (method === "vodafone_cash") return cfg.walletIntegrationId;
  return undefined;
};

// هل كل المفاتيح المطلوبه لطريقه الدفع دى موجوده (فى لوحه التحكم او فى .env)؟
const isConfigured = async (method, settingsDoc) => {
  const cfg = await getConfig(settingsDoc);
  return Boolean(cfg.secretKey && cfg.publicKey && cfg.hmacSecret && integrationIdFor(cfg, method));
};

// Paymob محتاج الاسم الاول و الاخير منفصلين - فبنقسم الاسم الكامل
const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);
  const first = parts.shift() || "Customer";
  const last = parts.join(" ") || first;
  // اقصى طول 50 حرف حسب شروط Paymob
  return { first_name: first.slice(0, 50), last_name: last.slice(0, 50) };
};

// بتعمل "نيه دفع" (intention) فى Paymob و بترجع رابط صفحه الدفع اللى هنحول العميل ليها
const createIntention = async ({ order, user, notificationUrl, redirectionUrl }) => {
  const cfg = await getConfig();
  const integrationId = integrationIdFor(cfg, order.paymentMethod);
  // Paymob بياخد المبلغ بالقروش (جنيه = 100 قرش)
  const amountCents = Math.round(order.totalPrice * 100);

  // رقم مرجعى مختلف لكل محاوله دفع (عشان العميل يقدر يحاول تانى على نفس الطلب)
  // الجزء اللى قبل "_" هو رقم الطلب عندنا - و بيرجعلنا فى الرد باسم merchant_order_id
  const specialReference = `${order._id}_${Date.now()}`;

  // المنتجات - و لازم مجموعهم يساوى الاجمالى فبنضيف الشحن كسطر لوحده
  const items = order.items.map((item) => ({
    name: (item.nameEn || item.name).slice(0, 50),
    amount: Math.round(item.price * 100),
    quantity: item.quantity,
  }));
  if (order.shippingPrice > 0) {
    items.push({ name: "Shipping", amount: Math.round(order.shippingPrice * 100), quantity: 1 });
  }

  // البيانات اللى هتتبعت لـ Paymob
  const body = {
    amount: amountCents,
    currency: "EGP",
    payment_methods: [Number(integrationId) || integrationId],
    items,
    // بيانات العميل (الاسم و الايميل مطلوبين)
    billing_data: {
      ...splitName(order.shippingAddress.fullName),
      email: user.email,
      phone_number: order.shippingAddress.phone,
      city: order.shippingAddress.city,
      street: order.shippingAddress.address.slice(0, 100),
      country: "EG",
      apartment: "NA",
      floor: "NA",
      building: "NA",
      state: order.shippingAddress.city,
    },
    special_reference: specialReference,
    // الصفحه اللى العميل هيرجعلها بعد الدفع
    redirection_url: redirectionUrl,
    extras: { orderId: String(order._id) },
  };
  // رابط الـ webhook: Paymob مايقدرش يوصل لـ localhost
  // فعلى جهازك بنعتمد على التحقق من صفحه الرجوع بدله (verifyRedirect فى paymentController)
  if (notificationUrl && !/localhost|127\.0\.0\.1/.test(notificationUrl)) {
    body.notification_url = notificationUrl;
  }

  // الطلب نفسه لـ Paymob - المفتاح السرى فى الـ header بعد كلمه Token
  const res = await fetch(`${API_BASE}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${cfg.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // لو الرد مش JSON نعتبره object فاضى
  const data = await res.json().catch(() => ({}));
  // لو حصل خطأ او مفيش client_secret نرمى error (502 = مشكله فى خدمه خارجيه)
  if (!res.ok || !data.client_secret) {
    const error = new Error(`Paymob error (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
    error.statusCode = 502;
    throw error;
  }

  return {
    specialReference,
    intentionId: String(data.id || ""),
    paymobOrderId: String(data.intention_order_id || ""),
    // رابط صفحه الدفع الموحده (Unified Checkout)
    checkoutUrl: `${CHECKOUT_BASE}/?publicKey=${encodeURIComponent(
      cfg.publicKey
    )}&clientSecret=${encodeURIComponent(data.client_secret)}`,
  };
};

// ---------------- التحقق بالـ HMAC ----------------
// Paymob بيبعت مع كل رد توقيع اسمه hmac - احنا بنحسبه بنفسنا و نقارنه
// لو زى بعض يبقى الرد جاى من Paymob فعلا و محدش لعب فيه
// الشرح: https://developers.paymob.com/paymob-docs/webhook-callbacks-and-hmac/hmac/hmac-transaction-callback
// الحقول دى لازم تتحط بالترتيب ده بالظبط
const HMAC_KEYS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order_id",
  "owner",
  "pending",
  "source_data_pan",
  "source_data_sub_type",
  "source_data_type",
  "success",
];

// بنلزق القيم جنب بعض بالترتيب و نعمل منها HMAC بخوارزميه SHA-512
const computeHmac = (flat, secret) => {
  const str = HMAC_KEYS.map((k) => (flat[k] === undefined || flat[k] === null ? "" : String(flat[k]))).join("");
  return crypto.createHmac("sha512", secret || "").update(str).digest("hex");
};

// مقارنه آمنه بين نصين (بتمنع نوع من الهجمات بيعتمد على وقت المقارنه)
const safeEqual = (a = "", b = "") => {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

// بيانات الـ webhook (POST) بتيجى فى شكل { type, obj: {...} } - بنحولها لشكل واحد مسطح
const flattenProcessed = (obj = {}) => ({
  amount_cents: obj.amount_cents,
  created_at: obj.created_at,
  currency: obj.currency,
  error_occured: obj.error_occured,
  has_parent_transaction: obj.has_parent_transaction,
  id: obj.id,
  integration_id: obj.integration_id,
  is_3d_secure: obj.is_3d_secure,
  is_auth: obj.is_auth,
  is_capture: obj.is_capture,
  is_refunded: obj.is_refunded,
  is_standalone_payment: obj.is_standalone_payment,
  is_voided: obj.is_voided,
  order_id: obj.order?.id,
  owner: obj.owner,
  pending: obj.pending,
  source_data_pan: obj.source_data?.pan,
  source_data_sub_type: obj.source_data?.sub_type,
  source_data_type: obj.source_data?.type,
  success: obj.success,
  // رقم الطلب بتاعنا (special_reference)
  merchant_order_id: obj.order?.merchant_order_id,
});

// بيانات صفحه الرجوع (GET) بتيجى فى الرابط بأسماء زى "source_data.pan" - بنحولها لنفس الشكل
const flattenRedirect = (q = {}) => ({
  amount_cents: q.amount_cents,
  created_at: q.created_at,
  currency: q.currency,
  error_occured: q.error_occured,
  has_parent_transaction: q.has_parent_transaction,
  id: q.id,
  integration_id: q.integration_id,
  is_3d_secure: q.is_3d_secure,
  is_auth: q.is_auth,
  is_capture: q.is_capture,
  is_refunded: q.is_refunded,
  is_standalone_payment: q.is_standalone_payment,
  is_voided: q.is_voided,
  order_id: q.order_id ?? q.order,
  owner: q.owner,
  pending: q.pending,
  source_data_pan: q["source_data.pan"],
  source_data_sub_type: q["source_data.sub_type"],
  source_data_type: q["source_data.type"],
  success: q.success,
  merchant_order_id: q.merchant_order_id,
});

// بترجع true لو الـ hmac اللى جه من Paymob مطابق للى احنا حسبناه
// لو مفيش HMAC secret خالص بنرفض (عشان محدش يزور رد بمفتاح فاضى)
const verifyHmac = async (flat, receivedHmac) => {
  const { hmacSecret } = await getConfig();
  if (!hmacSecret) return false;
  return safeEqual(computeHmac(flat, hmacSecret), receivedHmac);
};

module.exports = {
  getConfig,
  isConfigured,
  createIntention,
  verifyHmac,
  computeHmac,
  flattenProcessed,
  flattenRedirect,
};
