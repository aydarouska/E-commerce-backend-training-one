const mongoose = require("mongoose");

// اعدادات المتجر: document واحد بس فى قاعده البيانات و الادمن بيعدله من لوحه التحكم
// فيه: سعر الدولار - الشحن - بيانات حسابات انستاباى و البنك اللى بتظهر للعميل
const settingsSchema = new mongoose.Schema(
  {
    // مفتاح ثابت عشان نضمن ان فيه document واحد بس
    key: { type: String, default: "store", unique: true },

    // اسم المتجر بالعربى و الانجليزى و بيانات التواصل
    storeName: { type: String, default: "متجري" },
    storeNameEn: { type: String, default: "My Store" },
    supportPhone: { type: String, default: "" },
    supportEmail: { type: String, default: "" },

    // الدولار بكام جنيه - بيستخدم للعرض بس (الدفع دايما بالجنيه)
    usdRate: { type: Number, default: 50, min: 0.01 },

    // مصاريف الشحن بالجنيه
    shippingFee: { type: Number, default: 60, min: 0 },
    // الطلبات اللى فوق المبلغ ده الشحن بتاعها مجانى (0 = مفيش شحن مجانى)
    freeShippingThreshold: { type: Number, default: 0, min: 0 },

    // طرق الدفع: كل طريقه ليها مفتاح تشغيل (enabled) و بياناتها
    payments: {
      // كارت بنكى عن طريق Paymob
      card: {
        enabled: { type: Boolean, default: true },
      },
      // فودافون كاش عن طريق Paymob
      vodafone_cash: {
        enabled: { type: Boolean, default: true },
      },
      // انستاباى: العميل بيحول على العنوان ده
      instapay: {
        enabled: { type: Boolean, default: true },
        address: { type: String, default: "" }, // مثال: yourname@instapay
        accountName: { type: String, default: "" },
        phone: { type: String, default: "" },
      },
      // تحويل بنكى: العميل بيحول على الحساب ده
      bank_transfer: {
        enabled: { type: Boolean, default: true },
        bankName: { type: String, default: "" },
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        iban: { type: String, default: "" },
      },
    },

    // مفاتيح Paymob (اختياريه): لو الادمن دخلها من لوحه التحكم بتتفوق على اللى فى ملف .env
    // المفتاح السرى و HMAC بيتخزنوا مشفرين و عمرهم ما بيتبعتوا للمتصفح
    paymob: {
      secretKey: { type: String, default: "" },
      hmacSecret: { type: String, default: "" },
      publicKey: { type: String, default: "" },
      cardIntegrationId: { type: String, default: "" },
      walletIntegrationId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// شكل الاعدادات لما تتبعت للفرونت اند (بنشيل الحاجات الداخليه)
settingsSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret._id;
    delete ret.key;
    // مفاتيح Paymob عمرها ما بتخرج مع الاعدادات (لا للعميل و لا للادمن)
    delete ret.paymob;
    return ret;
  },
});

// داله بترجع document الاعدادات - و لو مش موجود بتعمله بالقيم الافتراضيه اول مره
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne({ key: "store" });
  if (!settings) settings = await this.create({ key: "store" });
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);
