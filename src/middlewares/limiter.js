const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes).
  message: "Too many requests from this IP, please try again after 15 minutes",
});
const limiterLogin = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  limit: 3, // Limit each IP to 50 requests per `window` (here, per 15 minutes).
  message: "Too many requests from this IP, please try again after 15 minutes",
});

module.exports = {
  limiter,
  limiterLogin,
};
