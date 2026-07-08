const { body } = require("express-validator");
const validate = require("../middlewares/Validator");

// 1️⃣ التحقق الخاص بإنشاء حساب جديد (Signup)
const validateUserRegistration = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3-30 characters"),

  body("email").isEmail().withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 8 })
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol",
    ),

  // 🎯 إضافة التحقق من الدور (Role) لضمان قبول القيم المعتمدة فقط في الـ enum
  body("role")
    .optional() // اختياري لأن الموديل يعطي قيمة افتراضية "user"
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),

  validate, // ميدل وير طباعة الأخطاء
];

// 2️⃣ التحقق الخاص بتسجيل الدخول (Login)
const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),

  body("password").isString().notEmpty().withMessage("Password is required"),

  validate, // ميدل وير طباعة الأخطاء
];

module.exports = {
  validateUserRegistration,
  loginValidation,
};
