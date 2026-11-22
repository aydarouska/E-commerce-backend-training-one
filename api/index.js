const mongoose = require("mongoose");
const app = require("../src/app");

// تم الاضافه: نقطه تشغيل الباك اند على Vercel
// على Vercel السيرفر مش بيفضل شغال طول الوقت - كل طلب بيشغل الداله دى
// فبنعمل اتصال واحد بقاعده البيانات و نعيد استخدامه فى الطلبات اللى بعده
let connection = null;

module.exports = async (req, res) => {
  try {
    // اول طلب بس هو اللى بيعمل الاتصال
    if (!connection) connection = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    await connection;
  } catch (error) {
    // لو الاتصال فشل نسيبه يحاول تانى مع الطلب الجاى
    connection = null;
    console.error("MongoDB connection error:", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ success: false, message: "Database connection failed" }));
  }
  // باقى الطلب بيروح لتطبيق Express العادى
  return app(req, res);
};
