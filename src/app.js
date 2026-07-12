require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

// ─── 1. الـ API ROUTES أولاً ───────────────────────────────────
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── 2. الملفات الثابتة ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── 3. الـ CATCH-ALL (يجب أن يكون الأخير) ──────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(process.env.PORT || 3000, () =>
      console.log("🚀 Server running"),
    ),
  );
