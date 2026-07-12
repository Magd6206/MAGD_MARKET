require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const notFoundHandler = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errHandler");
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

// ─── CORS CONFIGURATION ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5000",
  "http://localhost:5173",
  "https://magd.market",
  "https://www.magd.market",
  "https://magd-market-1.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

// تفعيل CORS مرة واحدة فقط (الاستدعاء المتكرر يسبب أخطاء)
app.use(cors(corsOptions));

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true,
  },
});

// ─── SECURITY MIDDLEWARES ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(hpp());
app.use(xss);
app.use(limiter);

// ─── GLOBAL PARSERS & STATICS ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

// تفعيل الملفات الثابتة
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(morgan("dev"));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/uploads", require("./routers/uploads.route"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── FRONTEND CATCH-ALL (الحل النهائي الآمن) ──────────────────────────────────
// استخدام RegExp كـ Object يمنع انهيار السيرفر نهائياً مع الإصدارات الحديثة
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── SOCKET.IO CONNECTIONS ───────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Connected ID:", socket.id);
  socket.on("msg", (data) => console.log("i see message " + data));
  socket.on("disconnect", () => console.log("Leaved : ", socket.id));
});

// ─── ERROR HANDLERS ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── SERVER START ────────────────────────────────────────────────────────────
const PORT = process.env.BACKEND_PORT || 3000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Database Connection Error:", err));
