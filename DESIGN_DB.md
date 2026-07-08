👥 1. الفاعلين في النظام (Actors) — من يستخدم النظام؟

    الزبون (Customer): يتصفح الملابس والأحذية، يضيف للسلة، يطبق كود الخصم، ويشتري عبر الكارد.

    المدير (Admin): يتحكم بالبضاعة (إضافة/تعديل/حذف ملابس وأحذية)، يتابع الطلبات، ويصنع أكواد الخصم.

🎯 2. الأفعال الرئيسية (Main Actions) — ماذا يفعلون؟

    استعراض المنتجات والفلترة (حسب الجنس: رجالي/نسائي/أطفال، أو حسب النوع: أحذية/ملابس).

    إدارة سلة المشتريات (إضافة قطعة بمقاس ولون معين، تعديل الكمية).

    تطبيق كود الخصم (Coupon) على السلة.

    إتمام الشراء والدفع بالكارد (Checkout).

    تقييم المنتج وكتابة مراجعة (Feedback/Review).

🗄️ 3. الجداول (Collections) — الأسماء التحليلية للنظام

    User (المستخدمين)

    Product (المنظومة الشاملة للألبسة والأحذية)

    Cart (سلة المشتريات المؤقتة)

    Order (الطلبات والفوترة الدائمة)

    Coupon (أكواد الخصم)

    Review (التقييمات)

🔄 4. رسم العلاقات بين الجداول (Relationships)

    User (1) -> (1) Cart (كل زبون له سلة واحدة فقط)

    User (1) -> (M) Order (الزبون يمكنه عمل عدة طلبات مستقبلاً)

    Product (1) -> (M) Review (المنتج الواحد له عدة تقييمات من زبائن مختلفين)

    User (1) -> (M) Review (الزبون الواحد يمكنه تقييم عدة منتجات)

    Order (1) -> (1) Coupon (الطلب الواحد يمكن أن يطبق عليه كود خصم واحد)

🧱 5. تسمية الحقول لكل جدول (Fields & Attributes)
👤 User Collection
JavaScript

User {
name, phone, email, password,
address: { city, street, building },
role: [customer, admin]
}

👟 Product Collection
JavaScript

Product {
title, desc, price, stock,
images: [strings], // روابط Cloudinary
mainCategory: [Men, Women, Kids],
subCategory: [Shoes, Clothing, Accessories],
sizes: [strings], // مثل ["42", "43"] أو ["M", "L"]
colors: [strings], // مثل ["Black", "White"]
avgRating
}

🛒 Cart Collection (السلة)
JavaScript

Cart {
userId: (REF: User),
items: [
{
productId: (REF: Product),
size: string, // المقاس المحدد
color: string, // اللون المحدد
quantity: number
}
],
totalPrice: number
}

📦 Order Collection (الطلب النهائي)
JavaScript

Order {
userId: (REF: User),
items: [ // نسخة مجمدة من المنتجات وقت الشراء لمنع تغير البيانات بالفاتورة
{ productId: (REF: Product), title, price, size, color, quantity }
],
totalAmount: number, // السعر النهائي بعد الخصم
shippingAddress: { city, street, phone },
paymentStatus: [Pending, Paid, Failed],
orderStatus: [Processing, Shipped, Delivered, Canceled],
couponUsed: (REF: Coupon) // اختياري
}

📉 Coupon Collection (أكواد الخصم)
JavaScript

Coupon {
code, // مثل "MAJD20"
discountType: [percentage, fixed],
discountValue: number,
expiryDate,
isActive
}

⭐ Review Collection (التقييمات)
JavaScript

Review {
userId: (REF: User),
productId: (REF: Product),
stars: number, // من 1 لـ 5
comment: string
}
