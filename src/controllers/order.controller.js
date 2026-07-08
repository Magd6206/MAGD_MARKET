const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Prodect");
const Coupon = require("../models/Coupon");
class OrderController {
  createOrder = async (req, res) => {
    const userId = req.user.id;
    const { shippingAddress, couponCode } = req.body;
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "عربتك فارغة! لا يمكنك إتمام الطلب بدون منتجات. 🛒",
      });
    }
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `المنتج غير موجود في المتجر.`,
        });
      }
      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color,
      );

      if (!variant || variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `عذراً، الكمية المطلوبة من المنتج (${product.title}) للمقاس ${item.size} واللون ${item.color} غير متوفرة في المخزن! المتبقي: ${variant ? variant.stock : 0}`,
        });
      }
      orderItems.push({
        productId: item.productId,
        title: product.title,
        price: product.price, // تجميد السعر الحالي وقت الشراء
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
      variant.stock -= item.quantity;
      await product.save();
    }
    let totalAmount = cart.totalPrice;
    let appliedCouponId = null;
    if (couponCode) {
      const Coupon = require("../models/Coupon"); // استدعاء الموديل محلياً أو في أعلى الملف
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      // فحص صلاحية الكوبون تماماً كما فعلنا في الـ validate
      if (
        !coupon ||
        !coupon.isActive ||
        new Date() > new Date(coupon.expiryDate)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "كود الخصم الممرر غير صحيح، منتهي الصلاحية، أو تم إيقافه! ❌",
        });
      }

      // حساب الخصم الحقيقي بناءً على النوع
      if (coupon.discountType === "percentage") {
        // خصم نسبة مئوية (مثلاً 20%)
        const discountAmount = (totalAmount * coupon.discountValue) / 100;
        totalAmount -= discountAmount;
      } else if (coupon.discountType === "fixed") {
        // خصم قيمة ثابتة (مثلاً خصم 50 دولار)
        totalAmount -= coupon.discountValue;
      }

      // حزام أمان: للتأكد أن السعر لا يصبح بالسالب لو كان الخصم الثابت كبيراً
      if (totalAmount < 0) totalAmount = 0;

      // حفظ معرف الكوبون لربطه بالفاتورة
      appliedCouponId = coupon._id;
    }
    const newOrder = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      couponUsed: appliedCouponId || null,
      paymentStatus: "Pending",
      orderStatus: "Processing",
    });
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    return res.status(201).json({
      success: true,
      message: "تم تسجيل طلبك بنجاح! 📦 سيتم الشحن قريباً.",
      data: newOrder,
    });
  };
  getMyOrders = async (req, res) => {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على أي طلبات.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "تم جلب طلباتك بنجاح! 📦",
      data: orders,
    });
  };
  cancelOrder = async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "الطلب غير موجود!" });
    }
    if (order.orderStatus !== "Processing") {
      return res.status(400).json({
        success: false,
        message: `عذراً، لا يمكنك إلغاء الطلب لأنه في حالة: ${order.orderStatus}`,
      });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === item.color,
        );
        if (variant) {
          variant.stock += item.quantity; // إرجاع الكمية الملغاة
          await product.save();
        }
      }
    }
    order.orderStatus = "Canceled";
    await order.save();
    return res.status(200).json({
      success: true,
      message: "تم إلغاء الطلب بنجاح، وإعادة كافة المنتجات للمستودع 🔄📦",
      data: order,
    });
  };
  getAllOrders = async (req, res) => {
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على أي طلبات.",
      });
    }
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  };
  updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "الطلب غير موجود!" });
    }
    if (orderStatus) {
      // حزام أمان: للتأكد من أن الأدمين أرسل حالة صحيحة متطابقة مع الـ Enum في السكيما
      const validStatuses = ["Processing", "Shipped", "Delivered", "Canceled"];
      if (!validStatuses.includes(orderStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "حالة شحن غير صالحة!" });
      }
      order.orderStatus = orderStatus;
    }

    // تحديث حالة الدفع إن أُرسلت في الـ Body
    if (paymentStatus) {
      const validPayments = ["Pending", "Paid", "Failed"];
      if (!validPayments.includes(paymentStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "حالة دفع غير صالحة!" });
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "تم تحديث حالة الطلب بنجاح 🎯",
      data: order,
    });
  };
}
module.exports = new OrderController();
