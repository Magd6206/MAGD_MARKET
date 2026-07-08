const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const restrictTo = require("../middlewares/restrictTo"); // تأكد من مسميات الميدل وير عندك
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
// كل المسارات أدناه تحتاج أن يكون المستخدم مسجل دخول أولاً

// مسارات الزبون الشخصية
router.get("/me", auth, asyncHandler(userController.getMe));
router.put("/update-me", auth, asyncHandler(userController.updateMe));

// مسارات الأدمن فقط لإدارة الحسابات
router.get(
  "/",
  [auth, restrictTo("admin")],
  asyncHandler(userController.getAllUsers),
);
router.get(
  "/:id",
  [auth, restrictTo("admin")],
  asyncHandler(userController.getUserById),
);
router.delete(
  "/:id",
  [auth, restrictTo("admin")],
  asyncHandler(userController.deleteUser),
);

module.exports = router;
