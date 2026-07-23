/**
 * MAGD MARKET — Express Application (Unified Server)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * DEPLOYMENT MODEL — Single unified process on Render
 * ────────────────────────────────────────────────────
 * One server. One port. One domain.
 *
 *   /api/v1/*   → REST API (auth, products, cart, orders, coupons, reviews)
 *   /*          → Static frontend from public/ (HTML, CSS, JS)
 *
 * PORT is read from process.env.PORT.
 * Render injects this automatically. Locally it falls back to 3000.
 * Never hardcode a port number in this file.
 *
 * CORS
 * ─────
 * Because the frontend and API share the same origin there is no
 * cross-origin situation in production. CORS is enabled to allow
 * Postman / curl / staging tools to reach the API without friction.
 * credentials: true is required for HTTP-only auth cookies.
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const morgan = require("morgan");
const path = require("path");

const notFoundHandler = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errHandler");
const xss = require("./middlewares/xss");
// const { limiter } = require("./middlewares/limiter");

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Same-origin in production — no CORS issues. This block allows Postman,
// mobile clients, and any staging origin to reach the API.
// credentials: true is required so HTTP-only cookies work correctly.
app.use(cors({ origin: true, credentials: true }));
app.use(cors({ origin: true, credentials: true }));

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

// ─── Security Headers ────────────────────────────────────────────────────────
// Helmet adds sensible HTTP security headers.
// CSP is tuned to allow the CDNs used by the frontend (Google Fonts,
// FontAwesome, Cloudinary images) without disabling inline styles/scripts
// that the plain-HTML frontend requires.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

app.use(hpp());
app.use(xss);
// app.use(limiter);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Static Uploads ──────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) =>
  res
    .status(200)
    .json({ success: true, message: "MAGD MARKET API is healthy ✅" }),
);

// ─── API Routes ──────────────────────────────────────────────────────────────
// Registered BEFORE the static file handler so API paths always win.
app.use("/api/v1/auth", require("./routers/auth.routes"));
app.use("/api/v1/users", require("./routers/user.routes"));
app.use("/api/v1/uploads", require("./routers/uploads.route"));
app.use("/api/v1/prodects", require("./routers/prodect.routes"));
app.use("/api/v1/carts", require("./routers/cart.routes"));
app.use("/api/v1/orders", require("./routers/order.routes"));
app.use("/api/v1/coupons", require("./routers/coupon.routes"));
app.use("/api/v1/reviews", require("./routers/review.routes"));

// ─── Frontend Static Files ───────────────────────────────────────────────────
// Express serves the public/ folder directly — no separate build step needed.
// Every .html, .css, .js, and image file is served from here.
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// Catch-all: any GET that isn't an /api/* route returns index.html.
// This allows direct navigation to any page URL (e.g. /cart.html, /admin.html).
// Catch-all for frontend routes (Express v5 compatible)
// Catch-all: any route that doesn't start with /api returns index.html
app.get((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(publicPath, "index.html"));
});

// ─── Error Handlers ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Database + Listen ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log("═══════════════════════════════════════════════");
      console.log(`✅  MongoDB connected`);
      console.log(`🚀  Server running on port ${PORT}`);
      console.log(`🌐  Open: http://localhost:${PORT}`);
      console.log("═══════════════════════════════════════════════");
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
