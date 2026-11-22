const fs = require("fs");
const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Settings = require("../models/Settings");
const { publicView } = require("./settingsController");
const { RECEIPT_DIR } = require("../middleware/upload");

const { ONLINE_METHODS } = Order;

// بيرجع الكميات للمخزن (بنستخدمها لما الطلب يتلغى)
// stockRestored بتمنع انها تتنفذ مرتين لنفس الطلب
const restoreStock = async (order) => {
  if (order.stockRestored) return;
  await Promise.all(
    order.items.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { countInStock: item.quantity } })
    )
  );
  order.stockRestored = true;
};

// بيجيب الطلب و يتأكد ان اللى طالبه هو صاحب الطلب او ادمن
// (لو حد تانى بنقول 404 عشان مايعرفش ان الطلب موجود اصلا)
const loadOrderFor = async (req) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const isOwner = String(order.user) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") throw new AppError("Order not found", 404);
  return order;
};

// @route   POST /api/orders
// @access  Private
// انشاء طلب من سله المستخدم
// الاسعار و الاجمالى بيتحسبوا هنا فى السيرفر - عمرنا ما نصدق السعر اللى جاى من المتصفح
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  // نتأكد ان طريقه الدفع المختاره متاحه حاليا
  const settings = await Settings.getSingleton();
  const available = (await publicView(settings)).payments;
  if (!available[paymentMethod]?.enabled) {
    throw new AppError("This payment method is not available right now", 400);
  }

  // نجيب السله بالمنتجات و نشيل اى منتج اتمسح
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const cartItems = (cart?.items || []).filter((i) => i.product);
  if (!cartItems.length) throw new AppError("Your cart is empty", 400);

  // نحجز الكميات من المخزن: التحديث بينجح بس لو الكميه المتاحه كفايه
  // ($gte = اكبر من او يساوى) - كده مينفعش اتنين يشتروا آخر قطعه فى نفس اللحظه
  const reserved = [];
  for (const item of cartItems) {
    const result = await Product.updateOne(
      { _id: item.product._id, countInStock: { $gte: item.quantity } },
      { $inc: { countInStock: -item.quantity } }
    );
    if (result.modifiedCount !== 1) {
      // لو منتج مفهوش كميه كفايه نرجع اللى حجزناه قبله
      await Promise.all(
        reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { countInStock: r.qty } }))
      );
      throw new AppError(`"${item.product.name}" doesn't have enough stock`, 400);
    }
    reserved.push({ id: item.product._id, qty: item.quantity });
  }

  // نسخه من المنتجات وقت الطلب (الاسم و السعر و الصوره)
  const items = cartItems.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    nameEn: i.product.nameEn,
    image: i.product.image,
    price: i.product.price,
    quantity: i.quantity,
  }));

  // اجمالى المنتجات
  const itemsPrice = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  // الشحن مجانى لو الطلب عدى الحد اللى الادمن حدده
  const freeShipping =
    settings.freeShippingThreshold > 0 && itemsPrice >= settings.freeShippingThreshold;
  const shippingPrice = freeShipping ? 0 : settings.shippingFee;

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    totalPrice: +(itemsPrice + shippingPrice).toFixed(2),
    paymentMethod,
  });

  // بعد ما الطلب اتعمل نفضى السله
  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, data: { order } });
});

// @route   GET /api/orders/mine
// @access  Private
// كل طلبات المستخدم الحالى من الاحدث للاقدم
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { orders } });
});

// @route   GET /api/orders/:id
// @access  Private (صاحب الطلب او الادمن)
// تفاصيل طلب واحد
const getOrderById = asyncHandler(async (req, res) => {
  const order = await loadOrderFor(req);
  await order.populate("user", "name email");
  res.status(200).json({ success: true, data: { order } });
});

// @route   POST /api/orders/:id/receipt   (الملف فى حقل اسمه "receipt")
// @access  Private
// خاص بانستاباى و التحويل البنكى: العميل بيرفع صوره التحويل
// و حاله الدفع بتبقى "under_review" لحد ما الادمن يأكد
const uploadOrderReceipt = asyncHandler(async (req, res) => {
  const order = await loadOrderFor(req);

  // لو رفضنا الطلب نمسح الصوره اللى اترفعت عشان ماتفضلش على السيرفر
  const cleanup = () => req.file && fs.unlink(req.file.path, () => {});

  if (ONLINE_METHODS.includes(order.paymentMethod)) {
    cleanup();
    throw new AppError("This order is paid online, no receipt needed", 400);
  }
  if (order.paymentStatus === "paid" || order.orderStatus === "cancelled") {
    cleanup();
    throw new AppError("This order can no longer be updated", 400);
  }
  if (!req.file) throw new AppError("Please attach a screenshot of the transfer", 400);

  // لو فيه ايصال قديم نمسحه و نحط الجديد
  if (order.receiptPath) fs.unlink(path.join(RECEIPT_DIR, order.receiptPath), () => {});

  order.receiptPath = req.file.filename;
  order.transferReference = (req.body.transferReference || "").slice(0, 100);
  order.paymentStatus = "under_review";
  await order.save();

  res.status(200).json({ success: true, data: { order } });
});

// @route   GET /api/orders/:id/receipt
// @access  Private (صاحب الطلب او الادمن)
// بيرجع صوره الايصال نفسها (مش متاحه لاى حد عشان فيها بيانات ماليه)
const getOrderReceipt = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const isOwner = String(order.user) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") throw new AppError("Order not found", 404);
  if (!order.receiptPath) throw new AppError("No receipt uploaded", 404);

  // basename للامان: بيمنع اى محاوله للخروج بره فولدر الايصالات
  res.sendFile(path.join(RECEIPT_DIR, path.basename(order.receiptPath)));
});

// @route   PATCH /api/orders/:id/cancel
// @access  Private
// العميل يلغى طلبه - مسموح بس لو الطلب لسه pending و ماتدفعش
const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await loadOrderFor(req);
  if (order.orderStatus !== "pending" || order.paymentStatus === "paid") {
    throw new AppError("This order can no longer be cancelled", 400);
  }
  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();
  await restoreStock(order);
  await order.save();
  res.status(200).json({ success: true, data: { order } });
});

// ---------------- الادمن ----------------

// @route   GET /api/orders?status=&paymentStatus=&search=&page=
// @access  Private/Admin
// كل الطلبات مع فلتره بالحاله و البحث برقم الطلب و الصفحات
const getAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) filter.orderNumber = new RegExp(req.query.search.trim(), "i");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { orders, page, totalPages: Math.max(Math.ceil(total / limit), 1), total },
  });
});

// @route   PATCH /api/orders/:id   body: { orderStatus?, paymentStatus?, adminNote? }
// @access  Private/Admin
// الادمن يغير حاله الطلب او حاله الدفع او يكتب ملاحظه
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  const { orderStatus, paymentStatus, adminNote } = req.body;

  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    order.paymentStatus = paymentStatus;
    // لو اتأكد الدفع: نسجل وقت الدفع و الطلب يبقى مؤكد
    if (paymentStatus === "paid") {
      order.paidAt = new Date();
      if (order.orderStatus === "pending") order.orderStatus = "confirmed";
    }
  }

  if (orderStatus && orderStatus !== order.orderStatus) {
    if (order.orderStatus === "cancelled") {
      throw new AppError("A cancelled order can't be reopened", 400);
    }
    order.orderStatus = orderStatus;
    if (orderStatus === "delivered") order.deliveredAt = new Date();
    // لو اتلغى: نرجع الكميات للمخزن
    if (orderStatus === "cancelled") {
      order.cancelledAt = new Date();
      await restoreStock(order);
    }
  }

  if (adminNote !== undefined) order.adminNote = adminNote;

  await order.save();
  await order.populate("user", "name email");
  res.status(200).json({ success: true, data: { order } });
});

// @route   GET /api/orders/admin/stats
// @access  Private/Admin
// ارقام سريعه للوحه التحكم (بتتحسب كلها مع بعض بـ Promise.all عشان تبقى اسرع)
const getStats = asyncHandler(async (req, res) => {
  const [users, products, orders, awaitingReview, pending, revenueAgg, lowStock] =
    await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "under_review" }),
      Order.countDocuments({ orderStatus: { $in: ["pending", "confirmed"] } }),
      // اجمالى الايرادات من الطلبات المدفوعه بس
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Product.countDocuments({ countInStock: { $lt: 5 } }),
    ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      products,
      orders,
      awaitingReview,
      pending,
      lowStock,
      revenue: revenueAgg[0]?.total || 0,
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  uploadOrderReceipt,
  getOrderReceipt,
  cancelMyOrder,
  getAllOrders,
  updateOrder,
  getStats,
  restoreStock,
};
