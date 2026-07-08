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
const xss = require("./middlewares/xss"); // أو مسار الميدل وير الخاص بك لـ XSS
const rateLimit = require("express-rate-limit");
const { limiter } = require("./middlewares/limiter");
const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const { Socket } = require("dgram");
const { disconnect } = require("cluster");
const io = new Server(server);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Frontend runs as its own independent process on port 5000.
// We lock CORS to that exact origin so HTTP-only cookies are exchanged correctly.
// Never share or mirror this value with the backend PORT variable.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // Required for HTTP-Only cookie exchange
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (product images) — served by the backend only.
// The public/ frontend folder is NOT served here; it has its own process.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(cookies());
app.use(limiter); // قراءة الـ body بصيغة JSON

app.use(helmet());
app.use(hpp());
app.use(xss);
app.use(morgan("dev"));

app.get("/api/v1/Test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Test endpoint is working successfully!",
  });
});
//Routs
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes")); // 👈 ربط مسار المصادقة
app.use("/api/v1/uploads", require("./routers/uploads.route"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));
io.on("connection", (Socket) => {
  console.log("Conected ID:", Socket.id);
  Socket.on("msg", (data) => {
    console.log(" i see message" + " " + data);
  });

  Socket.on("sentEmail", (data) => {
    console.log("i Receved Message");
    Socket.emit("World", { a: 1 });
  });

  Socket.on("disconnect", (socket) => {
    console.log("Leaved : ", Socket.id);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);
// ─── SERVER ───────────────────────────────────────────────────────────────────
// Backend runs strictly on port 3000. Do NOT share this variable with the
// frontend configuration. The frontend has its own PORT (5000) in its own env.
const PORT = process.env.BACKEND_PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log("✅ Connected to MongoDB");
      console.log(`🚀 Backend API running on http://localhost:${PORT}`);
      console.log(`🌐 Frontend expected at  http://localhost:5000`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
