const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    mainCategory: {
      type: String,
      required: true,
      enum: ["Men", "Women", "Kids"],
    },
    subCategory: {
      type: String,
      required: true,
      enum: ["Shoes", "Clothing", "Accessories"],
    },
    images: [{ type: String, required: true }],

    // 🎯 الحل السحري: مصفوفة المتغيرات التفصيلية للمخزون
    variants: [
      {
        size: { type: String, required: true }, // مثل: "42"
        color: { type: String, required: true }, // مثل: "Black"
        stock: { type: Number, required: true, min: 0, default: 0 }, // مخزون هذا المقاس وهذا اللون بالذات!
      },
    ],

    // متوسط التقييم سنحتاجه لاحقاً عند بناء نظام الـ Reviews
    avgRating: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
