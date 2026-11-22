// ارسال رسايل التأكيد: ايميل (عن طريق SMTP) و رساله SMS (عن طريق Twilio)
//
// لو بيانات الارسال مش موجوده فى ملف .env (وقت التجربه على جهازك)
// الكود بيتطبع فى التيرمنال بتاع الباك اند بدل ما يتبعت - عشان تقدر تجرب من غير اى اشتراكات
//
// قيم الايميل فى .env (مثال Gmail - محتاج "App Password" من حساب جوجل):
//   SMTP_HOST=smtp.gmail.com   SMTP_PORT=465   SMTP_USER=you@gmail.com   SMTP_PASS=xxxx   MAIL_FROM="متجري <you@gmail.com>"
// قيم الـ SMS فى .env (من لوحه تحكم Twilio):
//   TWILIO_ACCOUNT_SID=ACxxxx   TWILIO_AUTH_TOKEN=xxxx   TWILIO_FROM=+1xxxxxxxxxx

const nodemailer = require("nodemailer");

// هل بيانات الايميل موجوده؟
const emailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
// هل بيانات الـ SMS موجوده؟
const smsConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

// بنعمل الـ transporter مره واحده بس و نستخدمه كل مره
let transporter;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // بورت 465 مشفر من الاول - 587 بيتشفر بعد الاتصال
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// نصوص الرسايل بالعربى و الانجليزى (حسب لغه المستخدم)
const TEXT = {
  ar: {
    subject: "كود تأكيد حسابك",
    body: (code) => `كود تأكيد حسابك هو: ${code}\nالكود صالح لمده 10 دقايق. لو مش انت اللى طلبته تجاهل الرساله دى.`,
    sms: (code) => `كود التأكيد: ${code} (صالح 10 دقايق)`,
  },
  en: {
    subject: "Your verification code",
    body: (code) => `Your verification code is: ${code}\nIt expires in 10 minutes. If you didn't request it, ignore this message.`,
    sms: (code) => `Your verification code: ${code} (valid for 10 minutes)`,
  },
};

// ارسال كود التأكيد على الايميل
// بترجع "sent" لو اتبعت فعلا - او "dev" لو اتطبع فى التيرمنال
const sendEmailCode = async (to, code, lang = "ar") => {
  const t = TEXT[lang] || TEXT.ar;
  if (!emailConfigured()) {
    console.log(`\n[DEV] كود تأكيد الايميل لـ ${to}: ${code}\n`);
    return "dev";
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: t.subject,
    text: t.body(code),
    // نسخه HTML بسيطه و الكود كبير فى النص
    html: `<div dir="${lang === "ar" ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif;font-size:16px">
      <p>${t.body(code).split("\n")[0].replace(code, "")}</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#4F46E5">${code}</p>
      <p style="color:#6b7280">${t.body(code).split("\n")[1]}</p></div>`,
  });
  return "sent";
};

// ارسال كود التأكيد فى رساله SMS عن طريق Twilio (من غير مكتبه - طلب مباشر للـ API)
const sendSmsCode = async (to, code, lang = "ar") => {
  const t = TEXT[lang] || TEXT.ar;
  if (!smsConfigured()) {
    console.log(`\n[DEV] كود تأكيد الموبايل لـ ${to}: ${code}\n`);
    return "dev";
  }
  const sid = process.env.TWILIO_ACCOUNT_SID;
  // Twilio بيستخدم Basic Auth (الـ SID و الـ Token)
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM, Body: t.sms(code) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Twilio error (${res.status}): ${data.message || ""}`);
  }
  return "sent";
};

module.exports = { sendEmailCode, sendSmsCode, emailConfigured, smsConfigured };
