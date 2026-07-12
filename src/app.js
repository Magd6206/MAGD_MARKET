require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const notFoundHandler = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errHandler");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp"); // حماية Parameter Pollution
const xss = require("./middlewares/xss"); // ميدل وير الحماية من XSS
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
];

const corsOptions = {
  origin: function (origin, callback) {
    // السماح بالطلب إذا كان محلياً، من أداة اختبار (بدون origin)، أو مسجل بالقائمة
    if (
      !origin ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // مهم جداً لتبادل الكوكيز و الـ Tokens الآمنة
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

// تفعيل إعدادات الـ CORS للطلبات العادية
app.use(cors(corsOptions));

// 🚨 حل مشكلة الـ OPTIONS (Preflight): الاستجابة الفورية قبل أي ميدل وير آخر قد يسبب الـ 500
app.options("*", cors(corsOptions));

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true,
  },
});

// ─── SECURITY MIDDLEWARES ────────────────────────────────────────────────────
app.use(helmet());
app.use(hpp());
app.use(xss);
app.use(limiter); // حظر الـ Bots والإغراق مبكراً

// ─── GLOBAL PARSERS & STATICS ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(morgan("dev"));

// ─── TEST ENDPOINT ───────────────────────────────────────────────────────────
app.get("/api/v1/Test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Test endpoint is working successfully!",
  });
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/uploads", require("./routers/uploads.route"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── SOCKET.IO CONNECTIONS ───────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Connected ID:", socket.id);

  socket.on("msg", (data) => {
    console.log("i see message " + data);
  });

  socket.on("sentEmail", (data) => {
    console.log("i Receved Message");
    socket.emit("World", { a: 1 });
  });

  socket.on("disconnect", () => {
    console.log("Leaved : ", socket.id);
  });
});

// ─── ERROR HANDLERS ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── SERVER START ────────────────────────────────────────────────────────────
const PORT = process.env.BACKEND_PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log("✅ Connected to MongoDB");
      console.log(`🚀 Backend API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
