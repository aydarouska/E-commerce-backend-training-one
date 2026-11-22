const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");
const User = require("../models/User");
const { sendEmailCode, sendSmsCode } = require("../services/notify");

// ---------------- اعدادات اكواد التأكيد ----------------
const CODE_TTL_MS = 10 * 60 * 1000; // الكود صالح 10 دقايق
const RESEND_COOLDOWN_MS = 60 * 1000; // لازم يستنى دقيقه قبل ما يطلب كود جديد
const MAX_ATTEMPTS = 5; // بعد 5 محاولات غلط لازم يطلب كود جديد

// بيعمل كود من 6 ارقام عشوائى (crypto.randomInt آمن اكتر من Math.random)
const generateCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");
// بنخزن الكود متشفر (sha256) عشان لو حد شاف قاعده البيانات مايعرفش الكود
const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

// لغه المستخدم من الـ header اللى الفرونت اند بيبعته (عشان الرساله تبقى بلغته)
const langOf = (req) => (String(req.headers["accept-language"] || "ar").startsWith("en") ? "en" : "ar");

// بيانات المستخدم اللى بتتبعت للفرونت اند (من غير الباسورد و الاكواد)
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  emailVerified: user.emailVerified !== false,
  phoneVerified: user.phoneVerified !== false,
  isVerified: user.emailVerified !== false && user.phoneVerified !== false,
  createdAt: user.createdAt,
});

// وضع العرض التجريبى: لو SHOW_DEV_CODES=true فى ملف .env (او على Render)
// و الارسال مش متظبط، الكود بيرجع للفرونت اند و بيظهر على الشاشه
// عشان تقدر تجرب الموقع اونلاين قبل ما تشترك فى SMTP و Twilio
// تنبيه: اقفله (احذف المتغير) اول ما الموقع يشتغل بجد مع عملاء حقيقيين
const showDevCodes = () => process.env.SHOW_DEV_CODES === "true";

// بيعمل كود جديد لقناه معينه (email او phone) و يبعته
// بيرجع { status, devCode } - status = "sent" او "dev" (اتطبع فى التيرمنال) او "failed"
// devCode بيبقى موجود بس فى وضع العرض التجريبى
const issueCode = async (user, channel, lang) => {
  const code = generateCode();
  const v = user.verification || {};
  v[`${channel}CodeHash`] = hashCode(code);
  v[`${channel}CodeExpires`] = new Date(Date.now() + CODE_TTL_MS);
  v[`${channel}Attempts`] = 0;
  v[`${channel}SentAt`] = new Date();
  user.verification = v;
  user.markModified("verification");
  await user.save();

  let status;
  try {
    status =
      channel === "email" ? await sendEmailCode(user.email, code, lang) : await sendSmsCode(user.phone, code, lang);
  } catch (error) {
    // لو الارسال فشل (مثلا بيانات SMTP غلط) الحساب بيفضل موجود و يقدر يطلب كود تانى
    console.error(`فشل ارسال كود ${channel}:`, error.message);
    status = "failed";
  }
  // الكود بيرجع للشاشه بس لو ماتبعتش فعلا و وضع العرض التجريبى شغال
  return { status, devCode: status !== "sent" && showDevCodes() ? code : undefined };
};

// بيحول نتيجه issueCode لشكل الرد: { email: "dev", devCodes: { email: "123456" } }
const deliveryOf = (results) => {
  const delivery = {};
  const devCodes = {};
  for (const [channel, r] of Object.entries(results)) {
    delivery[channel] = r.status;
    if (r.devCode) devCodes[channel] = r.devCode;
  }
  if (Object.keys(devCodes).length) delivery.devCodes = devCodes;
  return delivery;
};

// @route   POST /api/auth/register
// @access  Public
// تم تعديلها: التسجيل بالاسم الاول و التانى و الايميل و الموبايل
// الحساب بيتعمل "غير متأكد" و بنبعت كود على الايميل و كود على الموبايل
// Role is never read from req.body - every user created here is "user".
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  const user = await User.create({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`, // الاسم الكامل
    email,
    phone, // بيوصل هنا بالصيغه الدوليه (الـ validator بيحوله)
    password,
    role: "user",
    emailVerified: false,
    phoneVerified: false,
    acceptedTermsAt: new Date(),
  });

  // نبعت الكودين (الايميل و الموبايل)
  const lang = langOf(req);
  const delivery = deliveryOf({
    email: await issueCode(user, "email", lang),
    phone: await issueCode(user, "phone", lang),
  });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    data: { user: publicUser(user), token, delivery },
  });
});

// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // .select("+password") is required because the schema marks password as
  // select: false by default.
  const user = await User.findOne({ email }).select("+password");

  // Same generic message whether the email doesn't exist or the password is
  // wrong - confirming which one it was would let an attacker enumerate
  // registered emails.
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user._id, user.role);

  // تم تعديلها: بنرجع بيانات التأكيد كمان (لو مش متأكد الفرونت بيوديه لصفحه التأكيد)
  res.status(200).json({
    success: true,
    data: { user: publicUser(user), token },
  });
});

// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user was already loaded (without the password) by the `protect` middleware.
  res.status(200).json({
    success: true,
    data: { user: publicUser(req.user) },
  });
});

// @route   POST /api/auth/verify/:channel   body: { code }   (channel = email او phone)
// @access  Private
// تم الاضافه: تأكيد الايميل او الموبايل بالكود
const verifyCode = asyncHandler(async (req, res) => {
  const { channel } = req.params;
  if (!["email", "phone"].includes(channel)) throw new AppError("Invalid channel", 400);

  // لازم نجيب الاكواد مخصوص لانها select: false
  const user = await User.findById(req.user._id).select("+verification");
  // لو اتأكد قبل كده مانعملش حاجه
  if (user[`${channel}Verified`] !== false) {
    return res.status(200).json({ success: true, data: { user: publicUser(user) } });
  }

  const v = user.verification || {};
  // مفيش كود او الكود انتهى
  if (!v[`${channel}CodeHash`] || new Date(v[`${channel}CodeExpires`]) < new Date()) {
    throw new AppError("The code has expired. Please request a new one.", 400);
  }
  // محاولات كتير غلط
  if ((v[`${channel}Attempts`] || 0) >= MAX_ATTEMPTS) {
    throw new AppError("Too many wrong attempts. Please request a new code.", 429);
  }

  // مقارنه الكود (بعد التشفير)
  if (hashCode(String(req.body.code || "").trim()) !== v[`${channel}CodeHash`]) {
    v[`${channel}Attempts`] = (v[`${channel}Attempts`] || 0) + 1;
    user.markModified("verification");
    await user.save();
    throw new AppError("The code is incorrect", 400);
  }

  // الكود صح: نأكد القناه و نمسح الكود
  user[`${channel}Verified`] = true;
  v[`${channel}CodeHash`] = undefined;
  v[`${channel}CodeExpires`] = undefined;
  user.markModified("verification");
  await user.save();

  res.status(200).json({ success: true, data: { user: publicUser(user) } });
});

// @route   POST /api/auth/verify/:channel/resend
// @access  Private
// تم الاضافه: طلب كود جديد (مره كل دقيقه بالكتير)
const resendCode = asyncHandler(async (req, res) => {
  const { channel } = req.params;
  if (!["email", "phone"].includes(channel)) throw new AppError("Invalid channel", 400);

  const user = await User.findById(req.user._id).select("+verification");
  if (user[`${channel}Verified`] !== false) throw new AppError("Already verified", 400);

  // نمنع الارسال الكتير (حمايه من الازعاج و من مصاريف الـ SMS)
  const sentAt = user.verification?.[`${channel}SentAt`];
  if (sentAt && Date.now() - new Date(sentAt).getTime() < RESEND_COOLDOWN_MS) {
    throw new AppError("Please wait a minute before requesting a new code", 429);
  }

  const delivery = deliveryOf({ [channel]: await issueCode(user, channel, langOf(req)) });
  res.status(200).json({ success: true, data: { delivery } });
});

// @route   PATCH /api/auth/phone   body: { phone }
// @access  Private
// تم الاضافه: تعديل رقم الموبايل قبل التأكيد (لو المستخدم كتبه غلط) و بنبعت كود للرقم الجديد
const changePhone = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+verification");
  if (user.phoneVerified !== false) throw new AppError("Phone number is already verified", 400);

  user.phone = req.body.phone;
  user.verification = { ...(user.verification || {}), phoneSentAt: undefined };
  const delivery = deliveryOf({ phone: await issueCode(user, "phone", langOf(req)) });

  res.status(200).json({ success: true, data: { user: publicUser(user), delivery } });
});

// @route   POST /api/auth/logout
// @access  Private
// JWTs are stateless: the server never stores issued tokens, so it cannot
// "revoke" one. This endpoint exists for a predictable frontend contract
// (POST /logout that returns 200), but the real logout happens client-side
// by deleting the stored token. The token itself stays technically valid
// until it expires (JWT_EXPIRE) even after this call.
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully",
    },
  });
});

module.exports = { register, login, getMe, verifyCode, resendCode, changePhone, logout };
