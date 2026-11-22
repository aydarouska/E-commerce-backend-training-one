const express = require("express");
const { getCart, addItem, updateItem, removeItem, clearCart } = require("../controllers/cartController");
const { protect, requireVerified } = require("../middleware/auth");

const router = express.Router();

// كل روابط السله محتاجه تسجيل دخول + حساب متأكد
router.use(protect, requireVerified);

router.get("/", getCart); // جلب السله
router.delete("/", clearCart); // تفضيه السله
router.post("/items", addItem); // اضافه منتج
router.patch("/items/:productId", updateItem); // تغيير الكميه
router.delete("/items/:productId", removeItem); // حذف منتج

module.exports = router;
