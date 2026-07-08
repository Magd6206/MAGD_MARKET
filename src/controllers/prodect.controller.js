const Product = require("../models/Prodect");
class prodectController {
  creatProdect = async (req, res) => {
    const {
      title,
      description,
      price,
      mainCategory,
      subCategory,
      images,
      variants,
    } = req.body;

    // حزام أمان: التحقق من وجود الحقول الإجبارية قبل الإرسال لقاعدة البيانات
    if (
      !title ||
      !description ||
      !price ||
      !mainCategory ||
      !subCategory ||
      !images ||
      images.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (title, description, price, mainCategory, subCategory, images)",
      });
    }

    // إنشاء المنتج في قاعدة البيانات
    const newProduct = await Product.create({
      title,
      description,
      price,
      mainCategory,
      subCategory,
      images,
      variants: variants || [],
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully 👟👕",
      data: newProduct,
    });
  };
  updateProdect = async (req, res) => {
    const productId = req.params.id;

    // نقوم بتحديث المنتج بناءً على الحقول المرسلة في req.body
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body, // يدمج التعديلات تلقائياً
      {
        new: true, // ليعيد المنتج بعد التعديل وليس قبله
        runValidators: true, // لتفعيل شروط السكيما أثناء التعديل (مثل منع السعر السالب)
      },
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully ✅",
      data: updatedProduct,
    });
  };
  deleteProdect = async (req, res) => {
    const productId = req.params.id;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully من المتجر نهائياً 🗑️",
    });
  };
  getAllProducts = async (req, res) => {
    const { mainCategory, subCategory, minPrice, maxPrice } = req.query;
    const queryFilter = {};

    // 1. الفلترة حسب الأقسام (إن وجدت)
    if (mainCategory) queryFilter.mainCategory = mainCategory;
    if (subCategory) queryFilter.subCategory = subCategory;

    // 2. الفلترة المتقدمة حسب السعر
    if (minPrice || maxPrice) {
      queryFilter.price = {};
      if (minPrice) queryFilter.price.$gte = Number(minPrice); // أكبر من أو يساوي
      if (maxPrice) queryFilter.price.$lte = Number(maxPrice); // أصغر من أو يساوي
    }

    // جلب المنتجات وبناء ترتيب تنازلي حسب الأحدث تلقائياً
    const products = await Product.find(queryFilter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  };
  getProductById = async (req, res) => {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  };
  updateProductVariantStock = async (req, res) => {
    const productId = req.params.productId; // 🎯 حزام أمان يلقطها كيف ما كانت مكتوبة!
    const variantId = req.params.variantId;
    const { stock } = req.body;

    if (stock === undefined || stock === null || Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid, non-negative stock number.",
      });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        "variants._id": variantId,
      },
      {
        $set: { "variants.$.stock": Number(stock) },
      },
      {
        returnDocument: "after", // ليعيد المنتج بعد التعديل مباشرة
        runValidators: true, // لتشغيل التحقق من شروط السكيما
      },
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product or specific Variant not found with the provided IDs.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Variant stock updated successfully in the warehouse! 🏬🔥",
      data: updatedProduct,
    });
  };
}
module.exports = new prodectController();
