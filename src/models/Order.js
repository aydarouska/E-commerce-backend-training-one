const mongoose = require("mongoose");

// طرق الدفع اللى المتجر بيدعمها
//  - card / vodafone_cash: الدفع اونلاين عن طريق Paymob و بيتأكد تلقائى
//  - instapay / bank_transfer: العميل بيحول بنفسه و يرفع صوره الايصال و الادمن يأكد
const PAYMENT_METHODS = ["card", "vodafone_cash", "instapay", "bank_transfer"];
// طرق الدفع الاونلاين بس (Paymob)
const ONLINE_METHODS = ["card", "vodafone_cash"];

// حالات الدفع: غير مدفوع - الايصال تحت المراجعه - مدفوع - فشل - تم الاسترداد
const PAYMENT_STATUSES = ["unpaid", "under_review", "paid", "failed", "refunded"];
// حالات الطلب: قيد الانتظار - مؤكد - اتشحن - اتسلم - ملغى
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

// نسخه من المنتج وقت الطلب (snapshot)
// عشان لو الادمن غير سعر المنتج او اسمه بعدين الطلب القديم مايتغيرش
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    nameEn: { type: String, default: "" },
    image: { type: String, default: "" },
    // السعر وقت الطلب بالجنيه
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // رقم الطلب اللى بيظهر للعميل زى ORD-24F7K2 (بيتعمل تلقائى تحت)
    orderNumber: { type: String, unique: true },
    // صاحب الطلب
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // المنتجات
    items: { type: [orderItemSchema], required: true },

    // عنوان الشحن
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      notes: { type: String, default: "", trim: true },
    },

    // كل المبالغ بالجنيه المصرى
    itemsPrice: { type: Number, required: true }, // اجمالى المنتجات
    shippingPrice: { type: Number, required: true, default: 0 }, // الشحن
    totalPrice: { type: Number, required: true }, // الاجمالى النهائى
    currency: { type: String, default: "EGP" },

    // طريقه الدفع و حالته و حاله الطلب
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending" },

    // خاص بالتحويل اليدوى (انستاباى / بنك): اسم ملف صوره الايصال و رقم العمليه
    receiptPath: { type: String, default: "" },
    transferReference: { type: String, default: "", trim: true },

    // خاص بـ Paymob: الارقام اللى Paymob بيرجعها عشان نربط العمليه بالطلب
    paymob: {
      intentionId: { type: String, default: "" },
      orderId: { type: String, default: "" },
      transactionId: { type: String, default: "" },
      specialReference: { type: String, default: "" },
    },

    // ملاحظه من الادمن بتظهر للعميل
    adminNote: { type: String, default: "" },
    // عشان مانرجعش المخزن مرتين لو الطلب اتلغى
    stockRestored: { type: Boolean, default: false },
    // تواريخ مهمه
    paidAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// قبل الحفظ: لو الطلب لسه مالوش رقم نعمله رقم قصير و مميز
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    // 4 حروف عشوائيه
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    // جزء من الوقت الحالى + الحروف العشوائيه
    this.orderNumber = `ORD-${Date.now().toString(36).slice(-4).toUpperCase()}${rand}`;
  }
  next();
});

// شكل الطلب لما يتبعت للفرونت اند
orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    // مسار ملف الايصال سر - بنبعت بس هل فيه ايصال ولا لا
    ret.hasReceipt = Boolean(ret.receiptPath);
    delete ret.receiptPath;
    return ret;
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
// بنصدر القوائم كمان عشان نستخدمها فى الـ validators و الكنترولرز
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.ONLINE_METHODS = ONLINE_METHODS;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
