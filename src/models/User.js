const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // الاسم الكامل (بيتعمل تلقائى من الاسم الاول + الاسم التانى عند التسجيل)
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    // تم الاضافه: الاسم الاول و الاسم التانى
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    // تم الاضافه: رقم الموبايل بالصيغه الدوليه (+201xxxxxxxxx)
    // sparse: true عشان المستخدمين القدام اللى مالهومش رقم مايعملوش مشكله مع unique
    phone: { type: String, trim: true, unique: true, sparse: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned by default on find queries
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // تم الاضافه: هل الايميل و الموبايل اتأكدوا؟
    // ملحوظه: مفيش default - المستخدمين القدام (قبل الميزه دى) القيمه عندهم undefined
    // و بنعتبرهم متأكدين عشان مانقفلش حساباتهم. التسجيل الجديد بيحطهم false
    emailVerified: { type: Boolean },
    phoneVerified: { type: Boolean },
    // تم الاضافه: وقت الموافقه على الشروط و الخصوصيه
    acceptedTermsAt: { type: Date },
    // تم الاضافه: اكواد التأكيد (متشفره) - select: false يعنى عمرها ما بتتبعت للفرونت
    verification: {
      type: {
        emailCodeHash: String, // كود الايميل بعد التشفير
        emailCodeExpires: Date, // الكود بينتهى امتى
        emailAttempts: { type: Number, default: 0 }, // عدد المحاولات الغلط
        emailSentAt: Date, // اخر مره اتبعت فيها كود (عشان نمنع الارسال الكتير)
        phoneCodeHash: String,
        phoneCodeExpires: Date,
        phoneAttempts: { type: Number, default: 0 },
        phoneSentAt: Date,
      },
      select: false,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Hash the password before saving, but only when it was actually set/changed
// (avoids re-hashing an already-hashed password on unrelated updates).
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// تم الاضافه: الحساب متأكد لو الايميل و الموبايل الاتنين مش false
userSchema.virtual("isVerified").get(function () {
  return this.emailVerified !== false && this.phoneVerified !== false;
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Belt-and-suspenders: strip password/__v even if a query ever explicitly
// selects the password field back in.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    // تم الاضافه: اكواد التأكيد سريه - و بنضيف isVerified
    delete ret.verification;
    ret.isVerified = ret.emailVerified !== false && ret.phoneVerified !== false;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
