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

// ─── 1. تعريف مسارات الـ API (الأولوية القصوى) ───
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── 2. خدمة ملفات الفرونت إند ───
// نستخدم ".." للخروج من مجلد src والوصول لمجلد public في الروت
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// ─── 3. الـ CATCH-ALL ───
app.get(/^(?!\/api).+/, (req, res) => {
  // هنا أيضاً استخدمنا publicPath لضمان الوصول للملف الصحيح
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start Server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("Database connection error:", err));
