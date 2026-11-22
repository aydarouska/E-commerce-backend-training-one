const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Order = require("../models/Order");
const paymob = require("../services/paymob");

const { ONLINE_METHODS } = Order;

// رابط الفرونت اند (من .env) - بنشيل اى / فى الاخر
const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
// رابط الباك اند العام (Paymob بيبعت عليه الـ webhook)
const serverUrl = () =>
  (process.env.SERVER_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");

// بتحدث الطلب لـ "مدفوع" او "فشل" حسب نتيجه العمليه اللى جت من Paymob (بعد التحقق منها)
// ينفع تتنده اكتر من مره بأمان (الـ webhook و صفحه الرجوع الاتنين بيندهوها)
const applyTransaction = async (flat) => {
  // رقم الطلب بتاعنا هو الجزء اللى قبل "_" فى special_reference
  const orderId = String(flat.merchant_order_id || "").split("_")[0];
  if (!orderId) return null;

  const order = await Order.findById(orderId).catch(() => null);
  if (!order) return null;
  // لو اتدفع خلاص مانعملش حاجه
  if (order.paymentStatus === "paid") return order;

  const success = String(flat.success) === "true";
  const pending = String(flat.pending) === "true";
  // نتأكد كمان ان المبلغ اللى اتدفع هو نفس اجمالى الطلب
  const amountOk = Number(flat.amount_cents) === Math.round(order.totalPrice * 100);

  if (success && !pending && amountOk) {
    order.paymentStatus = "paid";
    order.paidAt = new Date();
    if (order.orderStatus === "pending") order.orderStatus = "confirmed";
  } else if (!pending) {
    // لو العمليه خلصت و مانجحتش (لو لسه pending بنستنى)
    order.paymentStatus = "failed";
  }
  order.paymob.transactionId = String(flat.id || "");
  await order.save();
  return order;
};

// @route   POST /api/payments/paymob/:orderId
// @access  Private (صاحب الطلب)
// بيبدأ الدفع: بيعمل intention فى Paymob و يرجع { checkoutUrl } عشان الفرونت يحول العميل ليه
const startPaymobPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order || String(order.user) !== String(req.user._id)) {
    throw new AppError("Order not found", 404);
  }
  // شروط: الطلب اونلاين - مش مدفوع - مش ملغى - و Paymob متوصل
  if (!ONLINE_METHODS.includes(order.paymentMethod)) {
    throw new AppError("This order is not paid online", 400);
  }
  if (order.paymentStatus === "paid") throw new AppError("This order is already paid", 400);
  if (order.orderStatus === "cancelled") throw new AppError("This order was cancelled", 400);
  if (!(await paymob.isConfigured(order.paymentMethod))) {
    throw new AppError("Online payment isn't configured yet", 503);
  }

  const result = await paymob.createIntention({
    order,
    user: req.user,
    notificationUrl: `${serverUrl()}/api/payments/paymob/webhook`,
    redirectionUrl: `${clientUrl()}/payment/result`,
  });

  // نحفظ ارقام Paymob فى الطلب
  order.paymob.intentionId = result.intentionId;
  order.paymob.orderId = result.paymobOrderId;
  order.paymob.specialReference = result.specialReference;
  if (order.paymentStatus === "failed") order.paymentStatus = "unpaid";
  await order.save();

  res.status(200).json({ success: true, data: { checkoutUrl: result.checkoutUrl } });
});

// @route   POST /api/payments/paymob/webhook?hmac=...
// @access  Public (Paymob هو اللى بيندهه - و بنتأكد منه بالـ HMAC)
// Paymob بيبعت هنا نتيجه كل عمليه دفع
const paymobWebhook = asyncHandler(async (req, res) => {
  const obj = req.body?.obj;
  if (req.body?.type !== "TRANSACTION" || !obj) {
    return res.status(200).json({ received: true });
  }
  const flat = paymob.flattenProcessed(obj);
  // لو التوقيع غلط يبقى الطلب مش جاى من Paymob - نرفضه
  if (!(await paymob.verifyHmac(flat, req.query.hmac))) {
    throw new AppError("Invalid HMAC", 401);
  }
  await applyTransaction(flat);
  res.status(200).json({ received: true });
});

// @route   GET /api/payments/paymob/verify?<كل البيانات اللى Paymob حطها فى الرابط>
// @access  Public (التحقق بالـ HMAC)
// العميل بيرجع من Paymob على صفحه /payment/result و معاه بيانات العمليه فى الرابط
// الفرونت اند بيبعتها هنا عشان السيرفر يتأكد منها و يحدث الطلب
// (ده اللى بيخلى الدفع يشتغل على localhost حتى من غير webhook)
const verifyRedirect = asyncHandler(async (req, res) => {
  const flat = paymob.flattenRedirect(req.query);
  if (!(await paymob.verifyHmac(flat, req.query.hmac))) {
    throw new AppError("Couldn't verify this payment", 400);
  }
  const order = await applyTransaction(flat);
  if (!order) throw new AppError("Order not found", 404);
  res.status(200).json({
    success: true,
    data: { orderId: order.id, paymentStatus: order.paymentStatus },
  });
});

module.exports = { startPaymobPayment, paymobWebhook, verifyRedirect, applyTransaction };
