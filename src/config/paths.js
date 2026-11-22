const os = require("os");
const path = require("path");

// تم الاضافه: مكان فولدر الصور المرفوعه (uploads)
// على جهازك: فولدر uploads جنب المشروع زى ما هو
// على Vercel: ملفات المشروع للقراءه بس، فبنستخدم فولدر مؤقت (/tmp)
// تنبيه: الصور اللى بتترفع على Vercel مؤقته و بتتمسح - صور المنتجات الجاهزه (src/seed/images) مش بتتأثر
const UPLOAD_ROOT = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(__dirname, "..", "..", "uploads");

module.exports = { UPLOAD_ROOT };
