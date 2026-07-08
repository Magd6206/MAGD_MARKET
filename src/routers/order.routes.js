const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
const restrictTo = require("../middlewares/restrictTo");
router.post(
  "/createOrder",
  auth,
  asyncHandler((req, res) => orderController.createOrder(req, res)),
);
router.get(
  "/my-orders",
  auth,
  asyncHandler((req, res) => orderController.getMyOrders(req, res)),
);

// إلغاء طلب محدد بواسطة الـ id
router.put(
  "/cancel/:orderId",
  auth,
  asyncHandler((req, res) => orderController.cancelOrder(req, res)),
);

router.get(
  "/admin/all",
  auth,
  restrictTo("admin"), // 👈 فك التعليق ومرر الميدل وير الخاص بك للأدمن هنا
  asyncHandler((req, res) => orderController.getAllOrders(req, res)),
);

// تحديث حالة الطلب والدفع (Admin)
router.put(
  "/admin/update/:orderId",
  auth,
  restrictTo("admin"), // 👈 فك التعليق ومرر الميدل وير الخاص بك للأدمن هنا
  asyncHandler((req, res) => orderController.updateOrderStatus(req, res)),
);

module.exports = router;
