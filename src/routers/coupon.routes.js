const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
const restrictTo = require("../middlewares/restrictTo");

// روت فحص الكود (متاح للجميع/الزبائن عند الدفع)
router.post(
  "/validate",
  auth,
  asyncHandler((req, res) => couponController.validateCoupon(req, res)),
);

// روت إنشاء وجلب الأكواد (الأدمن)
router.post(
  "/admin/create",
  [auth, restrictTo("admin")],
  asyncHandler((req, res) => couponController.createCoupon(req, res)),
);
router.get(
  "/admin/all",
  [auth, restrictTo("admin")],
  asyncHandler((req, res) => couponController.getAllCoupons(req, res)),
);

module.exports = router;
