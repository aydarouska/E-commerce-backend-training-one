const crypto = require("crypto");

// تشفير المفاتيح السريه قبل ما تتخزن فى قاعده البيانات (AES-256-GCM)
// المفتاح بيتشتق من JWT_SECRET اللى فى ملف .env - يعنى لو قاعده البيانات اتسربت لوحدها المفاتيح تفضل مشفره
// تنبيه: لو غيرت JWT_SECRET بعد الحفظ، المفاتيح المشفره مش هتتفك و السيرفر هيرجع يستخدم قيم ملف .env
const PREFIX = "enc:v1:";

const getKey = () => {
  const base = process.env.JWT_SECRET;
  if (!base) throw new Error("JWT_SECRET is required to protect saved payment keys");
  return crypto.createHash("sha256").update(`secretbox:${base}`).digest();
};

// بتشفر نص و بترجع نص مشفر (iv:tag:data بصيغه base64)
const encrypt = (plain) => {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, data].map((b) => b.toString("base64")).join(":");
};

// بتفك التشفير - لو القيمه فاضيه او التشفير باظ بترجع نص فاضى
const decrypt = (value) => {
  if (!value || !String(value).startsWith(PREFIX)) return "";
  try {
    const [iv, tag, data] = String(value).slice(PREFIX.length).split(":").map((s) => Buffer.from(s, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
};

module.exports = { encrypt, decrypt };
