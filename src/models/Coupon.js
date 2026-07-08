const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // يحول الكود دائماً لأحرف كبيرة مثل MAJD20
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"], // نسبة مئوية (%) أو قيمة ثابتة ($)
      required: true,
    },
    discountValue: {
      type: Number,
      required: true, // قيمة الخصم (مثلاً 20 للنسبة المئوية أو 50 للقيمة الثابتة)
    },
    expiryDate: {
      type: Date,
      required: true, // تاريخ انتهاء صلاحية الكوبون
    },
    isActive: {
      type: Boolean,
      default: true, // تفعيل أو إيقاف الكوبون من قبل الإدارة
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);
