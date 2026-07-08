const Review = require("../models/Review");
const Product = require("../models/Prodect");
const mongoose = require("mongoose");
class ReviewController {
  addReview = async (req, res) => {
    const userId = req.user.id;
    const { productId, stars, comment } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "المنتج غير موجود! ❌" });
    }
    const alreadyReviewed = await Review.findOne({ userId, productId });
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message:
          "لقد قمت بتقييم هذا المنتج سابقاً! يمكنك تعديله بدلاً من إضافة جديد. ⚠️",
      });
    }

    // ج. إنشاء التقييم الجديد
    const newReview = await Review.create({
      userId,
      productId,
      stars,
      comment,
    });

    // د. 📊 المنطق الذكي (Aggregation): حساب متوسط النجوم الجديد للمنتج
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$stars" }, // دالة المونغو لحساب المتوسط الحسابي
        },
      },
    ]);

    // هـ. تحديث حقل الـ avgRating داخل مستند المنتج الحقيقي
    if (stats.length > 0) {
      product.avgRating = Math.round(stats[0].avgRating * 10) / 10; // تقريب لخانة عشرية واحدة مثل 4.5
      await product.save();
    }

    return res.status(201).json({
      success: true,
      message: "تمت إضافة تقييمك بنجاح وتحديث الـ Rating للمنتج! ⭐",
      data: newReview,
    });
  };
  getProductReviews = async (req, res) => {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .populate("userId", "name") // جلب اسم صاحب التقييم فقط لحماية الخصوصية
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  };

  deleteReview = async (req, res) => {
    const userId = req.user.id;
    const { reviewId } = req.params; // سنمرر ID التقييم في الرابط

    // أ. البحث عن التقييم والتأكد أنه يخص هذا المستخدم بالذات (حزام أمان)
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "التقييم غير موجود، أو ليس لديك صلاحية لحذفه! ❌",
      });
    }

    const productId = review.productId;

    // ب. حذف التقييم من الداتابيز
    await review.deleteOne();

    // ج. 📊 إعادة حساب المتوسط الحسابي بعد الحذف
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$stars" },
        },
      },
    ]);

    // د. تحديث المنتج بالمتوسط الجديد
    const product = await Product.findById(productId);
    if (product) {
      if (stats.length > 0) {
        product.avgRating = Math.round(stats[0].avgRating * 10) / 10;
      } else {
        product.avgRating = 0; // إذا كان هذا آخر تقييم وتم حذفه، نُعيد التقييم لـ 0
      }
      await product.save();
    }

    return res.status(200).json({
      success: true,
      message: "تم حذف تقييمك بنجاح، وإعادة حساب متوسط نجوم المنتج! 🧼⭐",
    });
  };
}
module.exports = new ReviewController();
