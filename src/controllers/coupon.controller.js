const Coupon = require("../models/Coupon");
class CouponController {
  createCoupon = async (req, res) => {
    const { code, discountType, discountValue, expiryDate } = req.body;
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ success: false, message: "كود الخصم هذا موجود بالفعل!" });
    }
    const newCoupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      expiryDate,
    });
    return res.status(201).json({
      success: true,
      message: "تم إنشاء كود الخصم بنجاح! 🎫",
      data: newCoupon,
    });
  };
  validateCoupon = async (req, res) => {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res
        .status(404)
        .json({
          success: false,
          message: "كود الخصم غير صحيح أو غير موجود! ❌",
        });
    }

    // ب. التحقق من حالة الكود (نشط أم معطل)
    if (!coupon.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "عذراً، هذا الكود تم إيقافه! ⚠️" });
    }

    // ج. التحقق من تاريخ انتهاء الصلاحية
    if (new Date() > new Date(coupon.expiryDate)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "عذراً، هذا الكود انتهت صلاحيته! 📅",
        });
    }

    // إذا كان صالحاً، نرسل بيانات الخصم ليطبقها الفرونت إند على الشاشة
    return res.status(200).json({
      success: true,
      message: "الكود صالح ومفعّل! ✅",
      data: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  };
  getAllCoupons = async (req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    if (!coupons || coupons.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "لا توجد أكواد خصم متاحة." });
    }
    return res
      .status(200)
      .json({ success: true, count: coupons.length, data: coupons });
  };
}
module.exports = new CouponController();
