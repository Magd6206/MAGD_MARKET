require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const xss = require("./middlewares/xss");
const { limiter } = require("./middlewares/limiter");
const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

// ─── MIDDLEWARES ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // للتبسيط أثناء الحل
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(hpp());
app.use(xss);
app.use(limiter);
app.use(morgan("dev"));

// ─── 1. الـ ROUTES يجب أن تكون في البداية دائماً ──────────────────────────
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/uploads", require("./routers/uploads.route"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── 2. الـ STATIC FILES ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── 3. الـ CATCH-ALL (للفرونت إند) ────────────────────────────────────────
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── ERROR HANDLERS ──────────────────────────────────────────────────────────
app.use(require("./middlewares/notFound"));
app.use(require("./middlewares/errHandler"));

// ─── SERVER START ────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI).then(() => {
  server.listen(process.env.PORT || 3000, () =>
    console.log("🚀 Server is running"),
  );
});
