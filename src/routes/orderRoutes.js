const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  uploadOrderReceipt,
  getOrderReceipt,
  cancelMyOrder,
  getAllOrders,
  updateOrder,
  getStats,
} = require("../controllers/orderController");
const { createOrderValidator, updateOrderValidator } = require("../validators/orderValidators");
const validate = require("../middleware/validate");
const { protect, isAdmin, requireVerified } = require("../middleware/auth");
const { uploadReceipt } = require("../middleware/upload");

const router = express.Router();

// كل روابط الطلبات محتاجه تسجيل دخول + حساب متأكد
router.use(protect, requireVerified);

// العميل
router.post("/", createOrderValidator, validate, createOrder); // انشاء طلب
router.get("/mine", getMyOrders); // طلباتى

// الادمن (لازم قبل /:id عشان كلمه "admin" ماتتقريش كأنها id)
router.get("/admin/stats", isAdmin, getStats); // احصائيات لوحه التحكم
router.get("/", isAdmin, getAllOrders); // كل الطلبات

router.get("/:id", getOrderById); // تفاصيل طلب
router.patch("/:id/cancel", cancelMyOrder); // العميل يلغى طلبه
router.post("/:id/receipt", uploadReceipt, uploadOrderReceipt); // رفع صوره الايصال
router.get("/:id/receipt", getOrderReceipt); // عرض صوره الايصال
router.patch("/:id", isAdmin, updateOrderValidator, validate, updateOrder); // الادمن يغير الحاله

module.exports = router;
