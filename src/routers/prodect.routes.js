const express = require("express");
const router = express.Router();
const productController = require("../controllers/prodect.controller");
const restrictTo = require("../middlewares/restrictTo");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
// 👥 مسارات عامة (متاحة للجميع بدون تسجيل دخول)
router.get("/", auth, asyncHandler(productController.getAllProducts));
router.get("/:id", auth, asyncHandler(productController.getProductById));

// 👮 مسارات الأدمن فقط (محمية بـ protect و restrictTo)

router.post(
  "/",
  [auth, restrictTo("admin")],
  asyncHandler(productController.creatProdect),
);
router.put(
  "/:id",
  [auth, restrictTo("admin")],
  asyncHandler(productController.updateProdect),
);
router.put(
  "/:productId/variants/:variantId",
  auth,
  restrictTo("admin"),
  asyncHandler(productController.updateProductVariantStock),
);
router.delete(
  "/:id",
  [auth, restrictTo("admin")],
  asyncHandler(productController.deleteProdect),
);

module.exports = router;
