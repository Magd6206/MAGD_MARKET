const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");

// إضافة تقييم (متاح للزبائن المسجلين)
router.post(
  "/add",
  auth,
  asyncHandler((req, res) => reviewController.addReview(req, res)),
);
router.delete(
  "/delete/:reviewId",
  auth,
  asyncHandler((req, res) => reviewController.deleteReview(req, res)),
);

// جلب تقييمات منتج معين (متاح للجميع - بدون auth)
router.get(
  "/product/:productId",
  asyncHandler((req, res) => reviewController.getProductReviews(req, res)),
);

module.exports = router;
