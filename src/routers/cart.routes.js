const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const restrictTo = require("../middlewares/restrictTo");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
router.get("/ByIdUser", auth, asyncHandler(cartController.getCartById));
router.post("/creatCart", auth, asyncHandler(cartController.addToCart));
router.put(
  "/updateQuantity",
  auth,
  asyncHandler(cartController.updateCartItemQuantity),
);
router.delete("/removeItem", auth, asyncHandler(cartController.removeFromCart));
router.delete("/clear", auth, asyncHandler(cartController.clearCart));
module.exports = router;
