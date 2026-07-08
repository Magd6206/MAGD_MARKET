const Cart = require("../models/Cart");
const Product = require("../models/Prodect");
class cartController {
  addToCart = async (req, res) => {
    const userId = req.user.id; // قادم من ميدل وير protect
    const { productId, size, color, quantity } = req.body;
    const requestedQuantity = Number(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // الخطوة 2: التحقق من المخزون (Variants Stock Checking)
    // نبحث داخل مصفوفة الـ variants عن المقاس واللون المطلوبين
    const matchedVariant = product.variants.find(
      (v) => v.size === size && v.color === color,
    );

    if (!matchedVariant) {
      return res.status(400).json({
        success: false,
        message: `This variant (Size: ${size}, Color: ${color}) is not available for this product.`,
      });
    }
    if (matchedVariant.stock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Sorry, only ${matchedVariant.stock} items left in stock for this size and color.`,
      });
    }

    let cart = await Cart.findOne({ userId });

    // السيناريو أ: إذا لم يكن لدى المستخدم عربة من قبل، ننشئها ونضيف العنصر
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [
          {
            productId,
            size,
            color,
            quantity: requestedQuantity,
            price: product.price,
          },
        ],
        totalPrice: product.price * requestedQuantity,
      });

      return res.status(201).json({
        success: true,
        message: "Product added to a new cart successfully 🛒",
        data: cart,
      });
    }
    // السيناريو ب: المستخدم لديه عربة سابقة، نبحث هل المنتج بنفس اللون والمقاس موجود فيها؟
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color,
    );
    if (existingItemIndex > -1) {
      // المنتج بنفس الخصائص موجود مسبقاً، نقوم بزيادة الكمية فقط بعد التأكد من المخزون الكلي
      const newQuantity =
        cart.items[existingItemIndex].quantity + requestedQuantity;
      if (matchedVariant.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Total in cart will exceed available stock (${matchedVariant.stock}).`,
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // منتج جديد أو خصائص جديدة (مقاس/لون مختلف)، نعمل Push كعنصر جديد في السلة
      cart.items.push({
        productId,
        size,
        color,
        quantity: requestedQuantity,
        price: product.price,
      });
    }

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    // حفظ التعديلات في قاعدة البيانات
    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Cart updated successfully 🛒",
      data: cart,
    });
  };
  getCartById = async (req, res) => {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });

    // إذا لم يكن لدى المستخدم سلة بعد (مستخدم جديد لم يضف شيئاً)
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Your cart is empty.",
        data: { items: [], totalPrice: 0 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully 🛒",
      data: cart,
    });
  };
  updateCartItemQuantity = async (req, res) => {
    const userId = req.user.id;
    const { productId, size, color, quantity } = req.body;
    const newQuantity = Number(quantity);
    if (!newQuantity || newQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    // 2️⃣ جلب المنتج للتأكد من المخزن الحالي في المستودع
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    // البحث عن الفارينت المطابق (المقاس واللون)
    const matchedVariant = product.variants.find(
      (v) => v.size === size && v.color === color,
    );

    if (!matchedVariant) {
      return res.status(400).json({
        success: false,
        message: "This variant is not available.",
      });
    }

    // التأكد من أن المستودع يغطي الكمية الجديدة المطلوبة
    if (matchedVariant.stock < newQuantity) {
      return res.status(400).json({
        success: false,
        message: `Sorry, only ${matchedVariant.stock} items available in warehouse.`,
      });
    }

    // 3️⃣ جلب سلة المستخدم لتحديثها
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }

    // البحث عن العنصر داخل السلة بمطابقة (المنتج + المقاس + اللون)
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in your cart.",
      });
    }

    // 4️⃣ تحديث الكمية للعنصر المحدد
    cart.items[itemIndex].quantity = newQuantity;

    // 5️⃣ إعادة حساب الإجمالي العام للسلة بالكامل
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    // حفظ التعديلات
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated successfully 🔄🛒",
      data: cart,
    });
  };
  removeFromCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, size, color } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        $pull: {
          items: { productId, size, color }, // يحذف العنصر الذي يطابق هذه الخصائص الثلاثة معاً
        },
      },
      { new: true }, // ليعيد السلة المحدثة بعد الحذف مباشرة
    );
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }

    // 2️⃣ إعادة حساب الإجمالي العام للسلة بعد الحذف
    if (cart.items.length > 0) {
      cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );
      await cart.save(); // حفظ الإجمالي الجديد
    } else {
      // إذا فرغت السلة تماماً، نصفر الإجمالي
      cart.totalPrice = 0;
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully 🗑️🛒",
      data: cart,
    });
  };
  clearCart = async (req, res) => { 
    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        $set: {
          items: [],
          totalPrice: 0,
        },
      },
      { new: true },
    );
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully 🧹🛒",
      data: cart,
    });
  };
}
module.exports = new cartController();
