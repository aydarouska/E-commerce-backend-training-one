const path = require("path");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// تم تعديلها: روابط الفرونت اند المسموحلها تكلم السيرفر بتتقرا من CLIENT_URL فى ملف .env
// ممكن تكتب اكتر من رابط بينهم فاصله
// و بناخد الـ origin بس (http://localhost:5173) من غير المسار (/E-commerce-training-one)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => {
    try {
      return new URL(url.trim()).origin;
    } catch {
      return url.trim();
    }
  });

app.use(
  cors({
    origin: (origin, cb) => {
      // الطلبات اللى مش من متصفح (زى Postman او Paymob) مابتبعتش origin - بنسمح بيها
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    // ضفنا PATCH عشان تعديل السله و الطلبات
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  })
);

// قراءه الـ body بصيغه JSON (اقصى حجم 1 ميجا)
app.use(express.json({ limit: "1mb" }));

// تم تعديلها: صور المنتجات بس هى المتاحه للعامه
// صور الايصالات فى uploads/receipts و بتتعرض من رابط محمى بتسجيل الدخول
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "..", "uploads", "products"))
);

// تم الاضافه: صور المنتجات الجاهزه اللى جايه مع الكود نفسه (src/seed/images)
// الفرق بينها و بين uploads: الصور دى جزء من المشروع و بتترفع مع الكود على GitHub و Render
// فبتفضل موجوده دايما - اما uploads فبتتمسح على الاستضافه المجانيه لما السيرفر يعيد التشغيل
// maxAge = المتصفح يحفظ الصوره 7 ايام عشان الموقع يبقى اسرع
app.use(
  "/static/products",
  express.static(path.join(__dirname, "seed", "images"), { maxAge: "7d" })
);

// طباعه كل طلب فى التيرمنال (ماعدا وقت التست)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// رابط بسيط للتأكد ان السيرفر شغال
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "E-commerce API is running" },
  });
});

// كل روابط الـ API بتبدأ بـ /api
app.use("/api", routes);

// اى رابط مش موجود + معالج الاخطاء الموحد
app.use(notFound);
app.use(errorHandler);

module.exports = app;
