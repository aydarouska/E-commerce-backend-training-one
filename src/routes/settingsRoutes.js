const express = require("express");
const { getSettings, getAdminSettings, updateSettings } = require("../controllers/settingsController");
const { updateSettingsValidator } = require("../validators/settingsValidators");
const validate = require("../middleware/validate");
const { protect, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", getSettings); // اعدادات الموقع (متاحه لاى حد)
router.get("/admin", protect, isAdmin, getAdminSettings); // الاعدادات كامله للادمن
router.put("/", protect, isAdmin, updateSettingsValidator, validate, updateSettings); // تعديل الاعدادات

module.exports = router;
