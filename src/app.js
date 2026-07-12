require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const app = express();

// Middlewares الأساسية
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

// ─── 1. تعريف مسارات الـ API (الأولوية القصوى) ───
// أي طلب يبدأ بـ /api/v1 سيتم توجيهه حصراً لهذه الملفات
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── 2. وسيط الحماية (Middleware) للفصل بين الـ API والملفات الثابتة ───
// إذا وصل الطلب هنا وكان يبدأ بـ /api ولم يتم التقاطه بالأعلى، فهو خطأ 404
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  }
  next();
});

// ─── 3. خدمة ملفات الفرونت إند (Static Files) ───
app.use(express.static(path.join(__dirname, "public")));

// ─── 4. الـ CATCH-ALL للواجهة الأمامية ───
// أي طلب غير API، يتم توجيهه لصفحة الـ index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("Database connection error:", err));
